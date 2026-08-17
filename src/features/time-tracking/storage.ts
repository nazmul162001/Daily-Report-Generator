import {
  endOfLocalDayMs,
  getLocalRetentionCutoffIso,
  getTodayIsoDate,
} from "@/lib/date";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
} from "@/lib/storage";
import { createId } from "@/lib/utils";
import { completeTaskFromTimestamps } from "./timer";
import { getProjectsDurationMinutes } from "./totals";
import type {
  RunningTaskRef,
  TimeTrackingStore,
  TrackingDay,
  TrackingProject,
  TrackingTask,
} from "./types";
import {
  TIME_TRACKING_RETENTION_DAYS,
  TIME_TRACKING_VERSION,
} from "./types";

export function emptyStore(): TimeTrackingStore {
  return { version: TIME_TRACKING_VERSION, days: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function normalizeTask(raw: unknown): TrackingTask | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : createId("task");
  const number =
    typeof raw.number === "string"
      ? raw.number.trim()
      : typeof raw.number === "number"
        ? String(raw.number)
        : "";
  if (!number) {
    return null;
  }

  const statusRaw = raw.status;
  const status: TrackingTask["status"] =
    statusRaw === "running" || statusRaw === "completed" || statusRaw === "idle"
      ? statusRaw
      : "idle";

  const startedAt = asFiniteNumber(raw.startedAt);
  const completedAt = asFiniteNumber(raw.completedAt);
  const durationMs = Math.max(0, asFiniteNumber(raw.durationMs) ?? 0);
  const editedMinutes = asFiniteNumber(raw.editedMinutes);

  return {
    id,
    number,
    status,
    startedAt,
    completedAt,
    durationMs,
    editedMinutes:
      editedMinutes != null && editedMinutes >= 0 ? editedMinutes : null,
  };
}

function normalizeProject(raw: unknown): TrackingProject | null {
  if (!isRecord(raw)) {
    return null;
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) {
    return null;
  }

  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .map(normalizeTask)
        .filter((task): task is TrackingTask => task !== null)
    : [];

  let note =
    typeof raw.note === "string" && raw.note.trim() ? raw.note.trim() : null;
  let noteUpdatedAt = asFiniteNumber(raw.noteUpdatedAt);

  // Migrate notes previously stored on individual tasks.
  if (!note && Array.isArray(raw.tasks)) {
    const migrated = raw.tasks
      .map((item) => {
        if (!isRecord(item) || typeof item.note !== "string") {
          return null;
        }
        const text = item.note.trim();
        if (!text) {
          return null;
        }
        const number =
          typeof item.number === "string" ? item.number.trim() : "";
        return number ? `${number}: ${text}` : text;
      })
      .filter((item): item is string => item !== null);
    if (migrated.length > 0) {
      note = migrated.join("\n\n");
      const latest = raw.tasks
        .map((item) => (isRecord(item) ? asFiniteNumber(item.noteUpdatedAt) : null))
        .filter((value): value is number => value !== null);
      noteUpdatedAt = latest.length > 0 ? Math.max(...latest) : Date.now();
    }
  }

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : createId("project"),
    name,
    caseNo: typeof raw.caseNo === "string" ? raw.caseNo.trim() : "",
    createdAt: asFiniteNumber(raw.createdAt) ?? Date.now(),
    tasks,
    note,
    noteUpdatedAt,
  };
}

function normalizeDay(raw: unknown): TrackingDay {
  if (!isRecord(raw)) {
    return { projects: [] };
  }
  const projects = Array.isArray(raw.projects)
    ? raw.projects
        .map(normalizeProject)
        .filter((project): project is TrackingProject => project !== null)
    : [];
  return { projects };
}

function isIsoDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function normalizeStore(raw: unknown): TimeTrackingStore {
  if (!isRecord(raw) || !isRecord(raw.days)) {
    return emptyStore();
  }

  const days: Record<string, TrackingDay> = {};
  for (const [key, value] of Object.entries(raw.days)) {
    if (!isIsoDateKey(key)) {
      continue;
    }
    days[key] = normalizeDay(value);
  }

  return {
    version: TIME_TRACKING_VERSION,
    days,
  };
}

export function pruneOldDays(
  store: TimeTrackingStore,
  today = getTodayIsoDate(),
  keepDays = TIME_TRACKING_RETENTION_DAYS,
): TimeTrackingStore {
  const cutoff = getLocalRetentionCutoffIso(keepDays, today);
  const days: Record<string, TrackingDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    if (date >= cutoff) {
      days[date] = day;
    }
  }
  return { ...store, days };
}

function mapAllTasks(
  store: TimeTrackingStore,
  mapper: (
    task: TrackingTask,
    context: { date: string; project: TrackingProject },
  ) => TrackingTask,
): TimeTrackingStore {
  const days: Record<string, TrackingDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    days[date] = {
      projects: day.projects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) => mapper(task, { date, project })),
      })),
    };
  }
  return { ...store, days };
}

export function findRunningTask(store: TimeTrackingStore): RunningTaskRef | null {
  let found: RunningTaskRef | null = null;
  for (const [date, day] of Object.entries(store.days)) {
    for (const project of day.projects) {
      for (const task of project.tasks) {
        if (task.status !== "running") {
          continue;
        }
        const candidate: RunningTaskRef = {
          date,
          projectId: project.id,
          taskId: task.id,
          taskNumber: task.number,
          projectName: project.name,
          startedAt: task.startedAt,
        };
        if (
          !found ||
          (candidate.startedAt ?? 0) > (found.startedAt ?? 0)
        ) {
          found = candidate;
        }
      }
    }
  }
  return found;
}

/** Close running tasks that belong to a previous local day at that day's end. */
export function settleStaleRunningTasks(
  store: TimeTrackingStore,
  today = getTodayIsoDate(),
): TimeTrackingStore {
  return mapAllTasks(store, (task, { date }) => {
    if (task.status !== "running" || date >= today) {
      return task;
    }
    const endedAt = Math.min(
      endOfLocalDayMs(date),
      Date.now(),
    );
    return completeTaskFromTimestamps(task, endedAt);
  });
}

/** Keep the newest running task; complete any others. */
export function enforceSingleRunningTask(
  store: TimeTrackingStore,
  now = Date.now(),
): TimeTrackingStore {
  const keeper = findRunningTask(store);
  if (!keeper) {
    return store;
  }

  return mapAllTasks(store, (task, { date, project }) => {
    if (task.status !== "running") {
      return task;
    }
    if (
      date === keeper.date &&
      project.id === keeper.projectId &&
      task.id === keeper.taskId
    ) {
      return task;
    }
    return completeTaskFromTimestamps(task, now);
  });
}

export function prepareStore(
  raw: unknown,
  today = getTodayIsoDate(),
  now = Date.now(),
): TimeTrackingStore {
  const normalized = normalizeStore(raw);
  const pruned = pruneOldDays(normalized, today);
  const settled = settleStaleRunningTasks(pruned, today);
  return enforceSingleRunningTask(settled, now);
}

function tryReadKey(key: string): unknown {
  return getStorageItem<unknown>(key, null);
}

function looksLikeStore(value: unknown): boolean {
  return isRecord(value) && isRecord(value.days);
}

export function loadTimeTrackingStore(
  today = getTodayIsoDate(),
  now = Date.now(),
): TimeTrackingStore {
  const primary = tryReadKey(STORAGE_KEYS.timeTracking);
  if (looksLikeStore(primary)) {
    return prepareStore(primary, today, now);
  }

  const backup = tryReadKey(STORAGE_KEYS.timeTrackingBackup);
  if (looksLikeStore(backup)) {
    return prepareStore(backup, today, now);
  }

  if (primary != null) {
    return prepareStore(primary, today, now);
  }
  if (backup != null) {
    return prepareStore(backup, today, now);
  }
  return emptyStore();
}

export function saveTimeTrackingStore(store: TimeTrackingStore): TimeTrackingStore {
  const prepared = prepareStore(store);
  setStorageItem(STORAGE_KEYS.timeTracking, prepared);
  setStorageItem(STORAGE_KEYS.timeTrackingBackup, prepared);
  return prepared;
}

export function getDay(
  store: TimeTrackingStore,
  date = getTodayIsoDate(),
): TrackingDay {
  return store.days[date] ?? { projects: [] };
}

export function setDay(
  store: TimeTrackingStore,
  date: string,
  day: TrackingDay,
): TimeTrackingStore {
  if (day.projects.length === 0) {
    const { [date]: _removed, ...rest } = store.days;
    return { ...store, days: rest };
  }
  return {
    ...store,
    days: {
      ...store.days,
      [date]: day,
    },
  };
}

export function updateTodayProjects(
  store: TimeTrackingStore,
  updater: (projects: TrackingProject[]) => TrackingProject[],
  date = getTodayIsoDate(),
): TimeTrackingStore {
  const current = getDay(store, date);
  return setDay(store, date, { projects: updater(current.projects) });
}

export function getTodayTrackedMinutes(options?: {
  includeRunning?: boolean;
  now?: number;
  today?: string;
}): number {
  const includeRunning = options?.includeRunning ?? true;
  const now = options?.now ?? Date.now();
  const today = options?.today ?? getTodayIsoDate();
  const store = loadTimeTrackingStore(today, now);
  const projects = getDay(store, today).projects;
  return getProjectsDurationMinutes(projects, now, includeRunning);
}

export function hasTodayTrackingActivity(options?: {
  today?: string;
  now?: number;
}): boolean {
  const today = options?.today ?? getTodayIsoDate();
  const now = options?.now ?? Date.now();
  const store = loadTimeTrackingStore(today, now);
  const projects = getDay(store, today).projects;
  return projects.some((project) =>
    project.tasks.some(
      (task) =>
        task.status === "running" ||
        task.status === "completed" ||
        (task.editedMinutes != null && task.editedMinutes > 0) ||
        task.durationMs > 0,
    ),
  );
}

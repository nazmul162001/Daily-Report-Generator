import { getTimedDurationMs } from "./timer";
import type { TimedKind, TimedLogEntry, WorkLogStore } from "./types";
import {
  getDay,
  loadTimeTrackingStore,
  saveTimeTrackingStore,
  setDay,
} from "@/features/time-tracking/storage";
import {
  applyEditedMinutes,
  completeTaskFromTimestamps,
  startTaskRun,
} from "@/features/time-tracking/timer";
import type {
  TimeTrackingStore,
  TrackingProject,
  TrackingTask,
} from "@/features/time-tracking/types";

const SYNC_TASK_PREFIX = "wl-";
const SYNC_PROJECT_PREFIX = "wlp-";

function isTaskKind(kind: TimedKind): boolean {
  return kind === "revision" || kind === "feedback" || kind === "question";
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function syncProjectId(kind: TimedKind, name: string): string {
  return `${SYNC_PROJECT_PREFIX}${kind}-${slug(name)}`;
}

function syncTaskId(entryId: string): string {
  return `${SYNC_TASK_PREFIX}${entryId}`;
}

function isSyncedTask(task: TrackingTask): boolean {
  return task.id.startsWith(SYNC_TASK_PREFIX);
}

function isSyncedProject(project: TrackingProject): boolean {
  return project.id.startsWith(SYNC_PROJECT_PREFIX);
}

function findProjectByName(
  projects: TrackingProject[],
  name: string,
): TrackingProject | undefined {
  const key = name.trim().toLowerCase();
  return projects.find((project) => project.name.trim().toLowerCase() === key);
}

function mapEntryToTrackingTask(
  entry: TimedLogEntry,
  now: number,
): TrackingTask {
  const id = syncTaskId(entry.id);
  const number = entry.taskNo.trim() || "Task";
  const durationMs = getTimedDurationMs(entry, now);
  const minutes = Math.max(0, Math.round(durationMs / 60_000));

  if (entry.status === "done") {
    if (minutes > 0 && entry.startedAt == null) {
      const completedAt = now;
      return {
        ...applyEditedMinutes(
          {
            id,
            number,
            status: "completed",
            startedAt: null,
            completedAt,
            durationMs: 0,
            editedMinutes: null,
          },
          minutes,
        ),
        status: "completed",
        completedAt,
      };
    }

    const base: TrackingTask = {
      id,
      number,
      status: "running",
      startedAt: entry.startedAt ?? Math.max(0, now - durationMs),
      completedAt: null,
      durationMs: entry.elapsedMs,
      editedMinutes: null,
    };
    return completeTaskFromTimestamps(base, now);
  }

  if (entry.status === "running") {
    const task: TrackingTask = {
      id,
      number,
      status: "idle",
      startedAt: null,
      completedAt: null,
      durationMs: entry.elapsedMs,
      editedMinutes: null,
    };
    return startTaskRun(task, entry.startedAt ?? now);
  }

  if (minutes > 0) {
    return applyEditedMinutes(
      {
        id,
        number,
        status: "idle",
        startedAt: null,
        completedAt: null,
        durationMs: 0,
        editedMinutes: null,
      },
      minutes,
    );
  }

  return {
    id,
    number,
    status: "idle",
    startedAt: null,
    completedAt: null,
    durationMs: 0,
    editedMinutes: null,
  };
}

function stripSyncedTasks(projects: TrackingProject[]): TrackingProject[] {
  return projects
    .map((project) => ({
      ...project,
      tasks: project.tasks.filter((task) => !isSyncedTask(task)),
    }))
    .filter(
      (project) => project.tasks.length > 0 || !isSyncedProject(project),
    );
}

function upsertSyncedDay(
  store: TimeTrackingStore,
  date: string,
  entries: TimedLogEntry[],
  now: number,
): TimeTrackingStore {
  const day = getDay(store, date);
  let projects = stripSyncedTasks(day.projects);

  for (const entry of entries) {
    const name = entry.label.trim();
    if (!name) {
      continue;
    }

    const task = mapEntryToTrackingTask(entry, now);
    let project = findProjectByName(projects, name);
    if (!project) {
      project = {
        id: syncProjectId(entry.kind, name),
        name,
        caseNo: "",
        createdAt: entry.loggedAt ?? now,
        tasks: [],
        note: null,
        noteUpdatedAt: null,
      };
      projects = [...projects, project];
    }

    const tasks = [...project.tasks];
    const index = tasks.findIndex((item) => item.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }

    projects = projects.map((item) =>
      item.id === project!.id ? { ...item, tasks } : item,
    );
  }

  return setDay(store, date, { projects });
}

/**
 * Mirror Detailed Report work-log tasks (revision / feedback / question)
 * into the Activity time-tracking store so Home + Activity stay in sync.
 */
export function syncWorkLogToTracking(
  workLog: WorkLogStore,
  now = Date.now(),
): TimeTrackingStore {
  let store = loadTimeTrackingStore(undefined, now);

  for (const [date, day] of Object.entries(workLog.days)) {
    const entries = day.timed.filter((entry) => isTaskKind(entry.kind));
    store = upsertSyncedDay(store, date, entries, now);
  }

  return saveTimeTrackingStore(store, { skipWorkLogSync: true });
}

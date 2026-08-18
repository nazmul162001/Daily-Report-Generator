import {
  endOfLocalDayMs,
  getLocalRetentionCutoffIso,
  getTodayIsoDate,
  isoDateFromLocalMs,
} from "@/lib/date";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { createId } from "@/lib/utils";
import { completeEntry, getTimedDurationMs, pauseEntry, resumeEntry, setElapsedMinutes } from "./timer";
import type {
  ReviewLogEntry,
  TimedKind,
  TimedLogEntry,
  WorkLogDay,
  WorkLogKind,
  WorkLogStore,
} from "./types";
import { WORK_LOG_RETENTION_DAYS, WORK_LOG_VERSION } from "./types";

export function emptyDay(): WorkLogDay {
  return { timed: [], reviews: [], boardProjects: {} };
}

export function emptyStore(): WorkLogStore {
  return { version: WORK_LOG_VERSION, days: {} };
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

function uniqueNames(values: unknown[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const name = value.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return names;
}

const BOARD_KINDS: WorkLogKind[] = [
  "revision",
  "feedback",
  "question",
  "review",
];

function isBoardKind(value: string): value is WorkLogKind {
  return BOARD_KINDS.includes(value as WorkLogKind);
}

function appendUniqueName(list: string[] | undefined, name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) {
    return list ?? [];
  }
  const current = list ?? [];
  if (current.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  return [...current, trimmed];
}

export function addBoardProject(
  day: WorkLogDay,
  kind: WorkLogKind,
  name: string,
): WorkLogDay {
  return {
    ...day,
    boardProjects: {
      ...day.boardProjects,
      [kind]: appendUniqueName(day.boardProjects?.[kind], name),
    },
  };
}

export function removeBoardProject(
  day: WorkLogDay,
  kind: WorkLogKind,
  name: string,
): WorkLogDay {
  const key = name.trim().toLowerCase();
  const nextList = (day.boardProjects?.[kind] ?? []).filter(
    (item) => item.toLowerCase() !== key,
  );
  const boardProjects = { ...(day.boardProjects ?? {}) };
  if (nextList.length === 0) {
    delete boardProjects[kind];
  } else {
    boardProjects[kind] = nextList;
  }
  return { ...day, boardProjects };
}

function normalizeBoards(
  raw: unknown,
  timed: TimedLogEntry[],
  reviews: ReviewLogEntry[],
): Partial<Record<WorkLogKind, string[]>> {
  const boards: Partial<Record<WorkLogKind, string[]>> = {};

  function add(kind: WorkLogKind, name: string) {
    boards[kind] = appendUniqueName(boards[kind], name);
  }

  if (Array.isArray(raw)) {
    for (const name of uniqueNames(raw)) {
      add("revision", name);
    }
  } else if (isRecord(raw)) {
    for (const [kind, names] of Object.entries(raw)) {
      if (!isBoardKind(kind) || !Array.isArray(names)) {
        continue;
      }
      for (const name of uniqueNames(names)) {
        add(kind, name);
      }
    }
  }

  for (const entry of timed) {
    if (isTaskKindName(entry.kind)) {
      add(entry.kind, entry.label);
    }
  }
  for (const review of reviews) {
    add("review", review.projectName);
  }
  return boards;
}

function isTaskKindName(kind: TimedKind): boolean {
  return kind === "revision" || kind === "feedback" || kind === "question";
}

const TIMED_KINDS: TimedKind[] = [
  "revision",
  "feedback",
  "question",
  "meeting",
  "investigation",
  "custom",
];

function normalizeTimed(raw: unknown): TimedLogEntry | null {
  if (!isRecord(raw)) {
    return null;
  }
  const kindRaw = raw.kind;
  const kind: TimedKind | null =
    typeof kindRaw === "string" && TIMED_KINDS.includes(kindRaw as TimedKind)
      ? (kindRaw as TimedKind)
      : null;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!kind || !label) {
    return null;
  }
  const statusRaw = raw.status;
  const status: TimedLogEntry["status"] =
    statusRaw === "running" ||
    statusRaw === "paused" ||
    statusRaw === "done" ||
    statusRaw === "idle"
      ? statusRaw
      : "idle";
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : createId("log"),
    kind,
    label,
    taskNo: typeof raw.taskNo === "string" ? raw.taskNo.trim() : "",
    status,
    startedAt: asFiniteNumber(raw.startedAt),
    elapsedMs: Math.max(0, asFiniteNumber(raw.elapsedMs) ?? 0),
    loggedAt:
      asFiniteNumber(raw.loggedAt) ??
      asFiniteNumber(raw.startedAt) ??
      undefined,
  };
}

function normalizeReview(raw: unknown): ReviewLogEntry | null {
  if (!isRecord(raw)) {
    return null;
  }
  const projectName =
    typeof raw.projectName === "string" ? raw.projectName.trim() : "";
  const minutes = asFiniteNumber(raw.minutes);
  if (!projectName || minutes == null || minutes < 0) {
    return null;
  }
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : createId("rev"),
    projectName,
    minutes,
  };
}

function normalizeDay(raw: unknown): WorkLogDay {
  if (!isRecord(raw)) {
    return emptyDay();
  }
  const timed = Array.isArray(raw.timed)
    ? raw.timed.map(normalizeTimed).filter((item): item is TimedLogEntry => item !== null)
    : [];
  const reviews = Array.isArray(raw.reviews)
    ? raw.reviews
        .map(normalizeReview)
        .filter((item): item is ReviewLogEntry => item !== null)
    : [];
  const boardProjects = normalizeBoards(raw.boardProjects, timed, reviews);
  return { timed, reviews, boardProjects };
}

function entryLocalDate(entry: TimedLogEntry, fallbackDate: string): string {
  const ms = entry.loggedAt ?? entry.startedAt;
  if (ms == null) {
    return fallbackDate;
  }
  return isoDateFromLocalMs(ms);
}

/** Move timed rows onto the local calendar day they were actually logged. */
export function rebucketEntriesToLocalDays(store: WorkLogStore): WorkLogStore {
  const timedByDate: Record<string, TimedLogEntry[]> = {};
  const reviewsByDate: Record<string, ReviewLogEntry[]> = {};
  const boardsByDate: Record<string, Partial<Record<WorkLogKind, string[]>>> = {};

  function timedBucket(date: string): TimedLogEntry[] {
    if (!timedByDate[date]) {
      timedByDate[date] = [];
    }
    return timedByDate[date];
  }

  for (const [date, day] of Object.entries(store.days)) {
    reviewsByDate[date] = [...(reviewsByDate[date] ?? []), ...day.reviews];
    boardsByDate[date] = {
      ...(boardsByDate[date] ?? {}),
      ...day.boardProjects,
    };
    for (const entry of day.timed) {
      timedBucket(entryLocalDate(entry, date)).push(entry);
    }
  }

  const dates = new Set([
    ...Object.keys(timedByDate),
    ...Object.keys(reviewsByDate),
    ...Object.keys(boardsByDate),
  ]);
  const days: Record<string, WorkLogDay> = {};
  for (const date of dates) {
    const timed = timedByDate[date] ?? [];
    const reviews = reviewsByDate[date] ?? [];
    const boards = { ...(boardsByDate[date] ?? {}) };
    for (const kind of Object.keys(boards) as WorkLogKind[]) {
      const names = boards[kind] ?? [];
      boards[kind] = names.filter((name) => {
        const key = name.trim().toLowerCase();
        const onThisDay = timed.some(
          (entry) =>
            entry.kind === kind &&
            entry.label.trim().toLowerCase() === key,
        );
        if (onThisDay) {
          return true;
        }
        const onOtherDay = Object.entries(timedByDate).some(
          ([otherDate, entries]) =>
            otherDate !== date &&
            entries.some(
              (entry) =>
                entry.kind === kind &&
                entry.label.trim().toLowerCase() === key,
            ),
        );
        return !onOtherDay;
      });
    }
    days[date] = {
      timed,
      reviews,
      boardProjects: normalizeBoards(boards, timed, reviews),
    };
  }
  return { ...store, days };
}

function isIsoDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function normalizeStore(raw: unknown): WorkLogStore {
  if (!isRecord(raw) || !isRecord(raw.days)) {
    return emptyStore();
  }
  const days: Record<string, WorkLogDay> = {};
  for (const [key, value] of Object.entries(raw.days)) {
    if (!isIsoDateKey(key)) {
      continue;
    }
    days[key] = normalizeDay(value);
  }
  return { version: WORK_LOG_VERSION, days };
}

export function pruneOldDays(
  store: WorkLogStore,
  today = getTodayIsoDate(),
): WorkLogStore {
  const cutoff = getLocalRetentionCutoffIso(WORK_LOG_RETENTION_DAYS, today);
  const days: Record<string, WorkLogDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    if (date >= cutoff) {
      days[date] = day;
    }
  }
  return { ...store, days };
}

export function findRunningEntry(
  store: WorkLogStore,
): { date: string; entry: TimedLogEntry } | null {
  let found: { date: string; entry: TimedLogEntry } | null = null;
  for (const [date, day] of Object.entries(store.days)) {
    for (const entry of day.timed) {
      if (entry.status !== "running") {
        continue;
      }
      if (
        !found ||
        (entry.startedAt ?? 0) > (found.entry.startedAt ?? 0)
      ) {
        found = { date, entry };
      }
    }
  }
  return found;
}

export function pauseOthers(
  store: WorkLogStore,
  keepId: string | null,
  now: number,
): WorkLogStore {
  const days: Record<string, WorkLogDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    days[date] = {
      ...day,
      timed: day.timed.map((entry) =>
        entry.status === "running" && entry.id !== keepId
          ? pauseEntry(entry, now)
          : entry,
      ),
    };
  }
  return { ...store, days };
}

function mapTimed(
  store: WorkLogStore,
  mapper: (entry: TimedLogEntry) => TimedLogEntry,
): WorkLogStore {
  const days: Record<string, WorkLogDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    days[date] = {
      ...day,
      timed: day.timed.map(mapper),
    };
  }
  return { ...store, days };
}

export function toggleTimedEntry(
  store: WorkLogStore,
  entryId: string,
  now: number,
): WorkLogStore {
  let target: TimedLogEntry | null = null;
  for (const day of Object.values(store.days)) {
    const found = day.timed.find((entry) => entry.id === entryId);
    if (found) {
      target = found;
      break;
    }
  }
  if (!target || target.status === "done") {
    return store;
  }
  if (target.status === "running") {
    return mapTimed(store, (entry) =>
      entry.id === entryId ? pauseEntry(entry, now) : entry,
    );
  }
  const paused = pauseOthers(store, entryId, now);
  return mapTimed(paused, (entry) =>
    entry.id === entryId ? resumeEntry(entry, now) : entry,
  );
}

export function setTimedMinutes(
  store: WorkLogStore,
  entryId: string,
  minutes: number,
): WorkLogStore {
  return mapTimed(store, (entry) =>
    entry.id === entryId ? setElapsedMinutes(entry, minutes) : entry,
  );
}

export function completeTimedEntry(
  store: WorkLogStore,
  entryId: string,
  now: number,
): WorkLogStore {
  return mapTimed(store, (entry) =>
    entry.id === entryId ? completeEntry(entry, now) : entry,
  );
}

export function removeTimedEntry(
  store: WorkLogStore,
  entryId: string,
): WorkLogStore {
  let next = store;
  for (const date of Object.keys(store.days)) {
    const day = getWorkLogDay(next, date);
    if (!day.timed.some((entry) => entry.id === entryId)) {
      continue;
    }
    next = setWorkLogDay(next, date, {
      ...day,
      timed: day.timed.filter((entry) => entry.id !== entryId),
    });
  }
  return next;
}

export function prepareStore(
  raw: unknown,
  today = getTodayIsoDate(),
  now = Date.now(),
): WorkLogStore {
  const normalized = rebucketEntriesToLocalDays(
    pruneOldDays(normalizeStore(raw), today),
  );
  const aged = completeStaleRunning(normalized, today, now);
  const running = findRunningEntry(aged);
  return pauseOthers(aged, running?.entry.id ?? null, now);
}

export function loadWorkLogStore(
  today = getTodayIsoDate(),
  now = Date.now(),
): WorkLogStore {
  return prepareStore(getStorageItem<unknown>(STORAGE_KEYS.workLog, null), today, now);
}

export function saveWorkLogStore(store: WorkLogStore): WorkLogStore {
  const prepared = prepareStore(store);
  setStorageItem(STORAGE_KEYS.workLog, prepared);
  return prepared;
}

export function getWorkLogDay(
  store: WorkLogStore,
  date = getTodayIsoDate(),
): WorkLogDay {
  const day = store.days[date];
  if (!day) {
    return emptyDay();
  }
  return {
    timed: day.timed,
    reviews: day.reviews,
    boardProjects: day.boardProjects ?? {},
  };
}

export function setWorkLogDay(
  store: WorkLogStore,
  date: string,
  day: WorkLogDay,
): WorkLogStore {
  const empty =
    day.timed.length === 0 &&
    day.reviews.length === 0 &&
    Object.values(day.boardProjects ?? {}).every((list) => list.length === 0);
  if (empty) {
    const { [date]: _removed, ...rest } = store.days;
    return { ...store, days: rest };
  }
  return { ...store, days: { ...store.days, [date]: day } };
}

export function updateTodayLog(
  store: WorkLogStore,
  updater: (day: WorkLogDay) => WorkLogDay,
  date = getTodayIsoDate(),
): WorkLogStore {
  return setWorkLogDay(store, date, updater(getWorkLogDay(store, date)));
}

export function completeStaleRunning(
  store: WorkLogStore,
  today = getTodayIsoDate(),
  now = Date.now(),
): WorkLogStore {
  const days: Record<string, WorkLogDay> = {};
  for (const [date, day] of Object.entries(store.days)) {
    days[date] = {
      ...day,
      timed: day.timed.map((entry) =>
        entry.status === "running" && date < today
          ? completeEntry(entry, Math.min(now, endOfLocalDayMs(date)))
          : entry,
      ),
    };
  }
  return { ...store, days };
}

export { getTimedDurationMs };

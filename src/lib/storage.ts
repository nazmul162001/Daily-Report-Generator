import { isBrowser } from "./utils";

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readFrom(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeTo(storage: Storage, key: string, raw: string): boolean {
  try {
    storage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const localRaw = readFrom(window.localStorage, key);
  if (localRaw !== null) {
    return parseJson(localRaw, fallback);
  }

  // Fallback if localStorage was full / blocked but session still has a copy
  const sessionRaw = readFrom(window.sessionStorage, key);
  if (sessionRaw !== null) {
    return parseJson(sessionRaw, fallback);
  }

  return fallback;
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  let raw: string;
  try {
    raw = JSON.stringify(value);
  } catch {
    return false;
  }

  const localOk = writeTo(window.localStorage, key, raw);
  const sessionOk = writeTo(window.sessionStorage, key, raw);

  if (localOk) {
    return true;
  }

  // Quota / private-mode: keep a session copy so a refresh in this tab still works
  return sessionOk;
}

export function removeStorageItem(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  let ok = true;
  try {
    window.localStorage.removeItem(key);
  } catch {
    ok = false;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    ok = false;
  }
  return ok;
}

export const STORAGE_KEYS = {
  preferences: "drg:preferences",
  draftTodayTask: "drg:draft:today-task",
  draftDailyReport: "drg:draft:daily-report",
  draftDetailedReport: "drg:draft:detailed-report",
  /** Renamed task titles for Today's Task (survives reload). */
  taskLabelsToday: "drg:task-labels:today-task",
  /** Renamed task titles for Daily Report (survives reload). */
  taskLabelsDaily: "drg:task-labels:daily-report",
  /** Full ordered task catalog (defaults + custom) for Today's Task. */
  taskCatalogToday: "drg:task-catalog:today-task",
  /** Full ordered task catalog (defaults + custom) for Daily Report. */
  taskCatalogDaily: "drg:task-catalog:daily-report",
  /** Project & task time tracking (versioned, last 30 local days). */
  timeTracking: "drg:time-tracking",
  /** Secondary copy used if the primary time-tracking payload is corrupt. */
  timeTrackingBackup: "drg:time-tracking:backup",
  /** Category work log for Detailed Report (meetings, reviews, timers). */
  workLog: "drg:work-log",
  /** Column order for Detailed Report (form / log / preview). */
  detailedReportColumns: "drg:detailed-report:columns",
  /** Display name for Daily Report title (local + cookie). */
  userProfile: "drg:user-profile",
} as const;

import { isBrowser } from "./utils";

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_KEYS = {
  preferences: "drg:preferences",
  savedReports: "drg:saved-reports",
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
} as const;

import type { AppPreferences, SavedReportMeta } from "@/types/common";
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
  STORAGE_KEYS,
} from "@/lib/storage";
import { saveTaskOrderFromTasks } from "@/lib/taskLabels";

export interface ReportRepository {
  getReports(): Promise<SavedReportMeta[]>;
  getReport(id: string): Promise<SavedReportMeta | null>;
  saveReport(report: SavedReportMeta): Promise<boolean>;
  deleteReport(id: string): Promise<void>;
}

export class LocalStorageReportRepository implements ReportRepository {
  async getReports(): Promise<SavedReportMeta[]> {
    const reports = getStorageItem<SavedReportMeta[]>(STORAGE_KEYS.savedReports, []);
    return [...reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getReport(id: string): Promise<SavedReportMeta | null> {
    const reports = await this.getReports();
    return reports.find((report) => report.id === id) ?? null;
  }

  async saveReport(report: SavedReportMeta): Promise<boolean> {
    const reports = getStorageItem<SavedReportMeta[]>(STORAGE_KEYS.savedReports, []);
    const index = reports.findIndex((item) => item.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.unshift(report);
    }
    return setStorageItem(STORAGE_KEYS.savedReports, reports);
  }

  async deleteReport(id: string): Promise<void> {
    const reports = getStorageItem<SavedReportMeta[]>(STORAGE_KEYS.savedReports, []);
    setStorageItem(
      STORAGE_KEYS.savedReports,
      reports.filter((report) => report.id !== id),
    );
  }
}

export const reportRepository: ReportRepository = new LocalStorageReportRepository();

const DEFAULT_PREFERENCES: AppPreferences = {
  lastReportType: null,
};

export function getPreferences(): AppPreferences {
  const stored = getStorageItem<AppPreferences & { employeeName?: string }>(
    STORAGE_KEYS.preferences,
    DEFAULT_PREFERENCES,
  );
  return {
    lastReportType: stored.lastReportType ?? null,
  };
}

export function setPreferences(prefs: Partial<AppPreferences>): void {
  const current = getPreferences();
  setStorageItem(STORAGE_KEYS.preferences, { ...current, ...prefs });
}

export function getDraft<T>(key: string): T | null {
  return getStorageItem<T | null>(key, null);
}

export function setDraft<T>(key: string, draft: T): boolean {
  const ok = setStorageItem(key, draft);
  if (ok) {
    syncTaskCatalogFromDraft(key, draft);
  }
  return ok;
}

function syncTaskCatalogFromDraft(key: string, draft: unknown): void {
  if (!draft || typeof draft !== "object" || !("tasks" in draft)) {
    return;
  }

  const scope =
    key === STORAGE_KEYS.draftTodayTask
      ? "today-task"
      : key === STORAGE_KEYS.draftDailyReport
        ? "daily-report"
        : null;
  if (!scope) {
    return;
  }

  const tasks = (draft as { tasks?: Array<{ key?: string; title: string }> })
    .tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return;
  }

  saveTaskOrderFromTasks(scope, tasks);
}

export function clearDraft(key: string): void {
  removeStorageItem(key);
}

export const TIME_TRACKING_VERSION = 1 as const;
export const TIME_TRACKING_RETENTION_DAYS = 30;

export type TrackingTaskStatus = "idle" | "running" | "completed";

export interface TrackingTask {
  id: string;
  /** Task number stored as a string (e.g. "1-1", "4"). */
  number: string;
  status: TrackingTaskStatus;
  /** Epoch ms when this run started. Source of truth for elapsed time. */
  startedAt: number | null;
  /** Epoch ms when the task was completed. */
  completedAt: number | null;
  /**
   * Elapsed milliseconds captured at complete time from timestamps.
   * Ignored for totals when `editedMinutes` is set.
   */
  durationMs: number;
  /** Manual override in whole minutes. Null = use timestamps. */
  editedMinutes: number | null;
}

export interface TrackingProject {
  id: string;
  name: string;
  caseNo: string;
  createdAt: number;
  tasks: TrackingTask[];
  /** Case-level note for later (e.g. why the project took extra time). */
  note: string | null;
  noteUpdatedAt: number | null;
}

export interface TrackingDay {
  projects: TrackingProject[];
}

export interface TimeTrackingStore {
  version: typeof TIME_TRACKING_VERSION;
  days: Record<string, TrackingDay>;
}

export interface RunningTaskRef {
  date: string;
  projectId: string;
  taskId: string;
  taskNumber: string;
  projectName: string;
  startedAt: number | null;
}

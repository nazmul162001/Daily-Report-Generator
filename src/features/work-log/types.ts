export const WORK_LOG_VERSION = 1 as const;
export const WORK_LOG_RETENTION_DAYS = 30;

export type WorkLogKind =
  | "revision"
  | "feedback"
  | "question"
  | "meeting"
  | "review"
  | "investigation"
  | "custom";

export type TimedStatus = "idle" | "running" | "paused" | "done";

export type TimedKind = Exclude<WorkLogKind, "review">;

export interface TimedLogEntry {
  id: string;
  kind: TimedKind;
  /** Project name, meeting topic, or investigation topic. */
  label: string;
  /** Task number for revision / feedback / question. */
  taskNo: string;
  status: TimedStatus;
  startedAt: number | null;
  elapsedMs: number;
}

export interface ReviewLogEntry {
  id: string;
  projectName: string;
  minutes: number;
}

export interface WorkLogDay {
  timed: TimedLogEntry[];
  reviews: ReviewLogEntry[];
  /** Project names scoped per category (Revision vs Feedback vs Question vs Review). */
  boardProjects: Partial<Record<WorkLogKind, string[]>>;
}

export interface WorkLogStore {
  version: typeof WORK_LOG_VERSION;
  days: Record<string, WorkLogDay>;
}

export interface RunningLogRef {
  date: string;
  entryId: string;
  kind: TimedKind;
  label: string;
}

export type ReportType = "today-task" | "daily-report" | "detailed-report";

export type ReportStatus = "completed" | "ongoing" | "not-started" | "custom";

export interface ReportTask {
  id: string;
  title: string;
  status?: ReportStatus;
  customStatus?: string;
  /** When false, task is excluded from the generated/copy output. Defaults to true. */
  included?: boolean;
}

export interface Recipient {
  id: string;
  name: string;
  /** Reserved for future Slack user ID integration */
  slackUserId?: string;
}

export interface WorkBreakdownItem {
  id: string;
  category: string;
  hours: string;
  isNA: boolean;
}

export interface BulletItem {
  id: string;
  text: string;
}

export interface SavedReportMeta {
  id: string;
  type: ReportType;
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  /** Structured form payload for load/edit (backend-ready) */
  payload?: unknown;
}

export interface AppPreferences {
  lastReportType: ReportType | null;
}

export type DraftStatus = "idle" | "saving" | "saved";

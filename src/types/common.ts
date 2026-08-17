export type ReportType = "today-task" | "daily-report" | "detailed-report";

export type ReportStatus = "completed" | "ongoing" | "not-started" | "custom";

export interface ReportTask {
  id: string;
  /** Stable identity for defaults + renamed labels (survives reloads). */
  key?: string;
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
  /** Minutes only; copy output converts to minutes + hours. */
  minutes: string;
  isNA: boolean;
}

export interface BulletItem {
  id: string;
  text: string;
}

export interface AppPreferences {
  lastReportType: ReportType | null;
}

export type DraftStatus = "idle" | "saving" | "saved" | "error";

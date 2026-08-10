import type { ReportTask } from "@/types/common";

export interface DailyReportData {
  id: string;
  date: string;
  section: string;
  tasks: ReportTask[];
}

export const STATUS_LABELS = {
  completed: "completed",
  ongoing: "on-going",
} as const;

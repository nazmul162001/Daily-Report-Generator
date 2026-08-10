import type { ReportTask } from "@/types/common";

export interface TodayTaskReport {
  id: string;
  date: string;
  section: string;
  tasks: ReportTask[];
}

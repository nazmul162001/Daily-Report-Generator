import type { BulletItem, Recipient, WorkBreakdownItem } from "@/types/common";

export interface DetailedReportData {
  id: string;
  date: string;
  recipients: Recipient[];
  workBreakdown: WorkBreakdownItem[];
  goalReview: BulletItem[];
  tomorrowGoals: BulletItem[];
}

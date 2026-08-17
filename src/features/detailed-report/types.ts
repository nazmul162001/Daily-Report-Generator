import type { BulletItem, Recipient, WorkBreakdownItem } from "@/types/common";

export interface DetailedReportData {
  id: string;
  date: string;
  recipients: Recipient[];
  workBreakdown: WorkBreakdownItem[];
  goalReview: BulletItem[];
  tomorrowGoals: BulletItem[];
  /**
   * When true, today's Time Tracking total must not overwrite Revision.
   * Undefined on legacy drafts: treated as custom if Revision ≠ default 294.
   */
  revisionManuallyEdited?: boolean;
}

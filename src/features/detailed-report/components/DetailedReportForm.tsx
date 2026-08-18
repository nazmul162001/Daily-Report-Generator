import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { didRevisionFieldsChange } from "@/features/time-tracking/revision";
import type { WorkLogDay } from "@/features/work-log/types";
import type { DetailedReportData } from "../types";
import { GoalReview } from "./GoalReview";
import { RecipientsEditor } from "./RecipientsEditor";
import { TomorrowGoals } from "./TomorrowGoals";
import { WorkBreakdown } from "./WorkBreakdown";

interface DetailedReportFormProps {
  report: DetailedReportData;
  errors: {
    recipients?: string;
    workBreakdown?: string;
    goalReview?: string;
    tomorrowGoals?: string;
  };
  selectedBreakdownId: string | null;
  logDay: WorkLogDay;
  now: number;
  onSelectBreakdown: (id: string) => void;
  onChange: (report: DetailedReportData) => void;
  columnDrag?: ReactNode;
}

export function DetailedReportForm({
  report,
  errors,
  selectedBreakdownId,
  logDay,
  now,
  onSelectBreakdown,
  onChange,
  columnDrag,
}: DetailedReportFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="Detailed CMS Report"
          description="Compose work breakdown and goals for stakeholders."
          action={
            columnDrag ? (
              <div className="hidden shrink-0 xl:block">{columnDrag}</div>
            ) : null
          }
        />
        <RecipientsEditor error={errors.recipients} />
      </Card>

      <Card>
        <WorkBreakdown
          items={report.workBreakdown}
          error={errors.workBreakdown}
          selectedId={selectedBreakdownId}
          logDay={logDay}
          now={now}
          onSelect={onSelectBreakdown}
          onChange={(workBreakdown) =>
            onChange({
              ...report,
              workBreakdown,
              revisionManuallyEdited: didRevisionFieldsChange(
                report.workBreakdown,
                workBreakdown,
              )
                ? true
                : report.revisionManuallyEdited,
            })
          }
        />
      </Card>

      <Card>
        <GoalReview
          items={report.goalReview}
          error={errors.goalReview}
          onChange={(goalReview) => onChange({ ...report, goalReview })}
        />
      </Card>

      <Card>
        <TomorrowGoals
          items={report.tomorrowGoals}
          error={errors.tomorrowGoals}
          onChange={(tomorrowGoals) => onChange({ ...report, tomorrowGoals })}
        />
      </Card>
    </div>
  );
}

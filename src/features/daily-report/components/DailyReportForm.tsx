import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { DailyReportData } from "../types";
import { TaskList } from "./TaskList";

interface DailyReportFormProps {
  report: DailyReportData;
  errors: {
    section?: string;
    tasks?: string;
  };
  onChange: (report: DailyReportData) => void;
}

export function DailyReportForm({
  report,
  errors,
  onChange,
}: DailyReportFormProps) {
  return (
    <Card>
      <CardHeader
        title="Report settings"
        description="Build your end-of-day report with statuses."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="daily-date"
          label="Date"
          type="date"
          value={report.date}
          onChange={(event) =>
            onChange({ ...report, date: event.target.value })
          }
        />
        <Input
          id="daily-section"
          label="Section"
          value={report.section}
          onChange={(event) =>
            onChange({ ...report, section: event.target.value })
          }
          error={errors.section}
          required
        />
      </div>

      <div className="mt-6">
        <TaskList
          tasks={report.tasks}
          error={errors.tasks}
          onChange={(tasks) => onChange({ ...report, tasks })}
        />
      </div>
    </Card>
  );
}

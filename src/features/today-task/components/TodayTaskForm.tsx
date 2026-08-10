import { FixedTaskRow } from "@/components/ui/FixedTaskRow";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import type { TodayTaskReport } from "../types";

interface TodayTaskFormProps {
  report: TodayTaskReport;
  errors: {
    section?: string;
    tasks?: string;
  };
  onChange: (report: TodayTaskReport) => void;
}

export function TodayTaskForm({ report, errors, onChange }: TodayTaskFormProps) {
  function updateField<K extends keyof TodayTaskReport>(
    key: K,
    value: TodayTaskReport[K],
  ) {
    onChange({ ...report, [key]: value });
  }

  function updateTaskIncluded(id: string, included: boolean) {
    onChange({
      ...report,
      tasks: report.tasks.map((task) =>
        task.id === id ? { ...task, included } : task,
      ),
    });
  }

  return (
    <Card>
      <CardHeader
        title="Report settings"
        description="Toggle which fixed tasks appear in today's plan."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="today-date"
          label="Date"
          type="date"
          value={report.date}
          onChange={(event) => updateField("date", event.target.value)}
        />
        <Input
          id="today-section"
          label="Section"
          value={report.section}
          onChange={(event) => updateField("section", event.target.value)}
          error={errors.section}
          required
        />
      </div>

      <div className="mt-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text">Task list</h3>
          <p className="mt-0.5 text-xs text-muted">
            Fixed checklist. Uncheck items to hide them from the copied report.
          </p>
        </div>
        {errors.tasks ? (
          <p className="mb-2 text-xs text-danger">{errors.tasks}</p>
        ) : null}

        <ul className="flex flex-col gap-3" aria-label="Today task list">
          {report.tasks.map((task) => (
            <li key={task.id}>
              <FixedTaskRow
                task={task}
                onIncludedChange={(included) =>
                  updateTaskIncluded(task.id, included)
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

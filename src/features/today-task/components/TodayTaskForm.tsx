import { FixedTaskRow } from "@/components/ui/FixedTaskRow";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { setTaskLabel } from "@/lib/taskLabels";
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

  function updateTaskTitle(id: string, title: string) {
    const task = report.tasks.find((item) => item.id === id);
    if (task?.key) {
      setTaskLabel("today-task", task.key, title);
    }
    onChange({
      ...report,
      tasks: report.tasks.map((item) =>
        item.id === id ? { ...item, title } : item,
      ),
    });
  }

  return (
    <Card>
      <CardHeader
        title="Report settings"
        description="Toggle tasks and rename them for your team (saved locally)."
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
            Use the pencil to rename. Names stay saved after reload.
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
                onTitleChange={(title) => updateTaskTitle(task.id, title)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

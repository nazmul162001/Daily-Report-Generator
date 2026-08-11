import { Button } from "@/components/ui/Button";
import { FixedTaskRow } from "@/components/ui/FixedTaskRow";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  SortableList,
  SortableRowLayout,
} from "@/components/ui/SortableList";
import { createId } from "@/lib/utils";
import {
  addTaskToCatalog,
  isCustomTaskKey,
  removeTaskFromCatalog,
  saveTaskOrderFromTasks,
  setTaskLabel,
} from "@/lib/taskLabels";
import type { ReportTask } from "@/types/common";
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

  function addTask() {
    const catalogItem = addTaskToCatalog("today-task", "New task");
    const task: ReportTask = {
      id: createId("task"),
      key: catalogItem.key,
      title: catalogItem.title,
      included: true,
    };
    onChange({ ...report, tasks: [...report.tasks, task] });
  }

  function removeTask(id: string) {
    const task = report.tasks.find((item) => item.id === id);
    if (!task || !isCustomTaskKey(task.key)) {
      return;
    }
    if (task.key) {
      removeTaskFromCatalog("today-task", task.key);
    }
    onChange({
      ...report,
      tasks: report.tasks.filter((item) => item.id !== id),
    });
  }

  function reorderTasks(tasks: ReportTask[]) {
    saveTaskOrderFromTasks("today-task", tasks);
    onChange({ ...report, tasks });
  }

  return (
    <Card>
      <CardHeader
        title="Report settings"
        description="Drag to reorder. Add or rename tasks — saved locally."
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
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text">Task list</h3>
            <p className="mt-0.5 text-xs text-muted">
              Drag the grip to reorder. Changes save after reload.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={addTask}
            className="w-full shrink-0 sm:w-auto"
          >
            Add task
          </Button>
        </div>
        {errors.tasks ? (
          <p className="mb-2 text-xs text-danger">{errors.tasks}</p>
        ) : null}

        <SortableList
          items={report.tasks}
          onReorder={reorderTasks}
          ariaLabel="Today task list"
          className="gap-3"
          renderItem={(task, _index, drag) => (
            <SortableRowLayout drag={drag}>
              <FixedTaskRow
                task={task}
                onIncludedChange={(included) =>
                  updateTaskIncluded(task.id, included)
                }
                onTitleChange={(title) => updateTaskTitle(task.id, title)}
                onRemove={
                  isCustomTaskKey(task.key)
                    ? () => removeTask(task.id)
                    : undefined
                }
              />
            </SortableRowLayout>
          )}
        />
      </div>
    </Card>
  );
}

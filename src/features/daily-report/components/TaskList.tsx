import { Button } from "@/components/ui/Button";
import { createId } from "@/lib/utils";
import {
  addTaskToCatalog,
  isCustomTaskKey,
  removeTaskFromCatalog,
  setTaskLabel,
} from "@/lib/taskLabels";
import type { ReportTask } from "@/types/common";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: ReportTask[];
  error?: string;
  onChange: (tasks: ReportTask[]) => void;
}

export function TaskList({ tasks, error, onChange }: TaskListProps) {
  function updateTask(id: string, next: ReportTask) {
    const prev = tasks.find((task) => task.id === id);
    if (
      prev &&
      next.title.trim() &&
      next.title.trim() !== prev.title.trim() &&
      next.key
    ) {
      setTaskLabel("daily-report", next.key, next.title);
    }
    onChange(tasks.map((task) => (task.id === id ? next : task)));
  }

  function addTask() {
    const catalogItem = addTaskToCatalog("daily-report", "New task");
    const task: ReportTask = {
      id: createId("task"),
      key: catalogItem.key,
      title: catalogItem.title,
      included: true,
      status: "completed",
    };
    onChange([...tasks, task]);
  }

  function removeTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task || !isCustomTaskKey(task.key)) {
      return;
    }
    if (task.key) {
      removeTaskFromCatalog("daily-report", task.key);
    }
    onChange(tasks.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text">Task list</h3>
          <p className="mt-0.5 text-xs text-muted">
            Defaults stay. Add or rename — saved after reload.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addTask}>
          Add task
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-3" aria-label="Daily report tasks">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onChange={(next) => updateTask(task.id, next)}
            onRemove={
              isCustomTaskKey(task.key)
                ? () => removeTask(task.id)
                : undefined
            }
          />
        ))}
      </ul>
    </div>
  );
}

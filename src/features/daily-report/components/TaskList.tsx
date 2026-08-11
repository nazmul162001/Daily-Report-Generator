import { Button } from "@/components/ui/Button";
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

  function reorderTasks(next: ReportTask[]) {
    saveTaskOrderFromTasks("daily-report", next);
    onChange(next);
  }

  return (
    <div>
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
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <SortableList
        items={tasks}
        onReorder={reorderTasks}
        ariaLabel="Daily report tasks"
        className="gap-3"
        renderItem={(task, _index, drag) => (
          <SortableRowLayout drag={drag}>
            <TaskItem
              task={task}
              onChange={(next) => updateTask(task.id, next)}
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
  );
}

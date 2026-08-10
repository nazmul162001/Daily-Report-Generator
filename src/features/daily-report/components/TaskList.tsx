import type { ReportTask } from "@/types/common";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: ReportTask[];
  error?: string;
  onChange: (tasks: ReportTask[]) => void;
}

export function TaskList({ tasks, error, onChange }: TaskListProps) {
  function updateTask(id: string, next: ReportTask) {
    onChange(tasks.map((task) => (task.id === id ? next : task)));
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text">Task list</h3>
        <p className="mt-0.5 text-xs text-muted">
          Fixed checklist. Toggle checkbox to include, status on the right.
        </p>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-3" aria-label="Daily report tasks">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onChange={(next) => updateTask(task.id, next)}
          />
        ))}
      </ul>
    </div>
  );
}

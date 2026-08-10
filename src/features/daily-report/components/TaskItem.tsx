import { EditableTaskTitle } from "@/components/ui/EditableTaskTitle";
import type { ReportTask } from "@/types/common";
import { STATUS_LABELS } from "../types";

interface TaskItemProps {
  task: ReportTask;
  onChange: (task: ReportTask) => void;
  onRemove?: () => void;
}

export function TaskItem({ task, onChange, onRemove }: TaskItemProps) {
  const status = task.status === "ongoing" ? "ongoing" : "completed";
  const included = task.included !== false;

  return (
    <li
      className={`rounded-xl border px-3 py-3 transition-colors ${
        included
          ? "border-border bg-background/60"
          : "border-border/70 bg-background/30 opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={included}
            onChange={(event) =>
              onChange({ ...task, included: event.target.checked })
            }
            className="peer sr-only"
            aria-label={`Include “${task.title}” in copied report`}
          />
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-border bg-surface transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white"
            aria-hidden
          >
            {included ? (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        </label>

        <EditableTaskTitle
          title={task.title}
          onSave={(title) => onChange({ ...task, title })}
        />

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-danger hover:bg-background"
            aria-label={`Remove “${task.title}”`}
          >
            Remove
          </button>
        ) : null}

        <div
          className="inline-flex shrink-0 rounded-lg border border-border bg-surface p-0.5"
          role="group"
          aria-label={`Status for ${task.title}`}
        >
          <button
            type="button"
            onClick={() => onChange({ ...task, status: "completed" })}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              status === "completed"
                ? "bg-success text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
            aria-pressed={status === "completed"}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...task, status: "ongoing" })}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              status === "ongoing"
                ? "bg-warning text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
            aria-pressed={status === "ongoing"}
          >
            On-Going
          </button>
        </div>
      </div>

      {included ? (
        <p className="mt-2 pl-9 text-xs text-muted">
          Output: [{STATUS_LABELS[status]}]
        </p>
      ) : (
        <p className="mt-2 pl-9 text-xs text-muted">Hidden from copy</p>
      )}
    </li>
  );
}

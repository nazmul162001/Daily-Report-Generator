import { EditableTaskTitle } from "@/components/ui/EditableTaskTitle";
import type { ReportTask } from "@/types/common";

interface TaskItemProps {
  task: ReportTask;
  onChange: (task: ReportTask) => void;
  onRemove?: () => void;
}

export function TaskItem({ task, onChange, onRemove }: TaskItemProps) {
  const status = task.status === "ongoing" ? "ongoing" : "completed";
  const included = task.included !== false;

  return (
    <div
      className={`rounded-xl border px-3 py-3 transition-colors sm:px-3.5 ${
        included
          ? "border-border bg-background/60"
          : "border-border/70 bg-background/30 opacity-70"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
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
        </div>

        <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:gap-2 md:border-0 md:pt-0">
          <div
            className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1 sm:inline-flex sm:w-auto sm:shrink-0"
            role="group"
            aria-label={`Status for ${task.title}`}
          >
            <button
              type="button"
              onClick={() => onChange({ ...task, status: "completed" })}
              className={`cursor-pointer rounded-lg px-2.5 py-2.5 text-xs font-semibold transition-colors sm:py-1.5 ${
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
              className={`cursor-pointer rounded-lg px-2.5 py-2.5 text-xs font-semibold transition-colors sm:py-1.5 ${
                status === "ongoing"
                  ? "bg-warning text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
              aria-pressed={status === "ongoing"}
            >
              On-Going
            </button>
          </div>

          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer rounded-lg px-2 py-2 text-xs font-semibold text-danger hover:bg-background sm:py-1.5"
              aria-label={`Remove “${task.title}”`}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { EditableTaskTitle } from "@/components/ui/EditableTaskTitle";
import type { ReportTask } from "@/types/common";

interface FixedTaskRowProps {
  task: ReportTask;
  onIncludedChange: (included: boolean) => void;
  onTitleChange: (title: string) => void;
}

/** Shared fixed-task row: checkbox, editable title, optional trailing content. */
export function FixedTaskRow({
  task,
  onIncludedChange,
  onTitleChange,
}: FixedTaskRowProps) {
  const included = task.included !== false;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
        included
          ? "border-border bg-background/60"
          : "border-border/70 bg-background/30 opacity-70"
      }`}
    >
      <label className="relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={included}
          onChange={(event) => onIncludedChange(event.target.checked)}
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

      <EditableTaskTitle title={task.title} onSave={onTitleChange} />

      {!included ? (
        <span className="text-xs text-muted">Hidden from copy</span>
      ) : null}
    </div>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface EditableTaskTitleProps {
  title: string;
  onSave: (title: string) => void;
}

/** Task title with pencil control that opens a professional edit modal. */
export function EditableTaskTitle({ title, onSave }: EditableTaskTitleProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  useEffect(() => {
    if (open) {
      setDraft(title);
      setError(null);
      // Focus after modal mounts / paints
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [open, title]);

  function close() {
    setOpen(false);
    setDraft(title);
    setError(null);
  }

  function commit() {
    const next = draft.trim();
    if (!next) {
      setError("Task name cannot be empty.");
      inputRef.current?.focus();
      return;
    }
    if (next !== title) {
      onSave(next);
    }
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-text">
          {title}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-primary sm:h-8 sm:w-8"
          aria-label={`Edit “${title}”`}
          title="Edit task name"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L8.25 18.463 3 19.5l1.037-5.25L16.862 3.487Z"
            />
          </svg>
        </button>
      </div>

      <Modal
        open={open}
        title="Edit task name"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={commit}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-left">
          <p className="text-sm text-muted">
            Update the label for this task. It will be used in your preview and
            when you copy the report.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={fieldId}
              className="text-sm font-medium text-text"
            >
              Task name
              <span className="ml-0.5 text-danger" aria-hidden>
                *
              </span>
            </label>
            <input
              ref={inputRef}
              id={fieldId}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                }
              }}
              maxLength={200}
              placeholder="e.g. Review remaining tickets"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-text shadow-sm transition-colors placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-11"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            {error ? (
              <p id={`${fieldId}-error`} className="text-xs text-danger">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted">
                Press Enter to save, or Escape to cancel.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

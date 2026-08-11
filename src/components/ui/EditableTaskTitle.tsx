import { useEffect, useRef, useState } from "react";

interface EditableTaskTitleProps {
  title: string;
  onSave: (title: string) => void;
}

/** Inline edit for checklist task names (pencil icon). */
export function EditableTaskTitle({ title, onSave }: EditableTaskTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(title);
    }
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const next = draft.trim();
    if (!next) {
      setDraft(title);
      setEditing(false);
      return;
    }
    if (next !== title) {
      onSave(next);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(title);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            }
          }}
          className="min-w-0 w-full flex-1 rounded-lg border border-primary bg-surface px-2.5 py-2 text-sm font-medium text-text outline-none ring-2 ring-primary/20 sm:py-1.5"
          aria-label="Edit task name"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={commit}
            className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover sm:py-1.5"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-text sm:py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-start gap-1.5 sm:items-center">
      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-text">
        {title}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
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
  );
}

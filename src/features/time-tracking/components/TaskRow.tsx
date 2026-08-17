import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDurationLabel, formatMinutesShort } from "@/lib/duration";
import {
  durationMsToMinutes,
  formatElapsedClock,
  getTaskDurationMs,
} from "../timer";
import type { TrackingTask } from "../types";

interface TaskRowProps {
  task: TrackingTask;
  now: number;
  onStart: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TrashIcon() {
  return (
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
        d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"
      />
      <path strokeLinecap="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

function PencilIcon() {
  return (
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
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </svg>
  );
}

export function TaskRow({
  task,
  now,
  onStart,
  onComplete,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const elapsedMs = getTaskDurationMs(task, now);
  const minutes = durationMsToMinutes(elapsedMs);

  return (
    <div className="rounded-xl border border-border bg-background/60 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-lg bg-surface px-2.5 py-1 font-mono text-sm font-semibold text-text ring-1 ring-border">
            {task.number}
          </span>
          {task.status === "completed" ? (
            <Badge variant="success">Completed</Badge>
          ) : task.status === "running" ? (
            <Badge variant="info">Running</Badge>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {task.status === "idle" ? (
            <>
              <Button size="sm" onClick={onStart}>
                Start
              </Button>
              <span className="min-w-[5.5rem] font-mono text-sm tabular-nums text-muted">
                00:00:00
              </span>
            </>
          ) : null}

          {task.status === "running" ? (
            <>
              <Button size="sm" variant="success" onClick={onComplete}>
                Complete
              </Button>
              <span className="min-w-[5.5rem] font-mono text-sm tabular-nums text-text">
                {formatElapsedClock(elapsedMs)}
              </span>
            </>
          ) : null}

          {task.status === "completed" ? (
            <>
              <span className="min-w-0 text-sm font-medium break-words text-text">
                {formatDurationLabel(String(Math.round(minutes)), false)}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={onEdit}
                aria-label={`Edit time for task ${task.number}`}
                title="Edit minutes"
              >
                <PencilIcon />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </>
          ) : null}

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger/10"
            aria-label={`Delete task ${task.number}`}
            title="Delete task"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      {task.status === "running" ? (
        <p className="mt-2 text-xs text-muted">
          {formatMinutesShort(minutes)} elapsed · timestamps stay accurate after
          refresh or sleep
        </p>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import { durationMsToMinutes, formatElapsedClock } from "@/features/time-tracking/timer";
import { formatMinutesShort } from "@/lib/duration";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { isTaskKind, kindLabel } from "./categories";
import {
  entriesForKind,
  groupTasksByProject,
  liveMinutesForKind,
  projectNamesForKind,
  roundLiveMinutes,
} from "./totals";
import { getTimedDurationMs } from "./timer";
import type { TimedKind, TimedLogEntry, WorkLogKind } from "./types";
import type { WorkLogController } from "./useWorkLog";

interface WorkLogPanelProps {
  kind: WorkLogKind;
  category: string;
  log: WorkLogController;
  onClose: () => void;
  columnDrag?: ReactNode;
  columnResizeRight?: ReactNode;
}

const fieldClass =
  "h-8 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-sm text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function WorkLogPanel({
  kind,
  category,
  log,
  onClose,
  columnDrag,
  columnResizeRight,
}: WorkLogPanelProps) {
  const live = roundLiveMinutes(liveMinutesForKind(log.day, kind, log.now));

  return (
    <aside className="work-log-panel relative flex h-fit max-h-[inherit] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--c-shadow)] max-xl:rounded-t-3xl">
      {columnResizeRight ? (
        <div className="absolute right-0 top-1/2 z-30 hidden translate-x-1/2 -translate-y-1/2 xl:block">
          {columnResizeRight}
        </div>
      ) : null}
      <header className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text">
            {category.trim() || kindLabel(kind)}
          </h3>
          <p className="mt-0.5 text-xs tabular-nums text-muted">
            {formatMinutesShort(live)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {columnDrag ? <div className="hidden xl:block">{columnDrag}</div> : null}
          <IconBtn label="Close" onClick={onClose} tone="muted">
            <CloseIcon />
          </IconBtn>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {kind === "review" ? (
          <ReviewBoard log={log} />
        ) : isTaskKind(kind) ? (
          <ProjectBoard kind={kind} log={log} />
        ) : (
          <TopicBoard kind={kind} log={log} />
        )}
      </div>
    </aside>
  );
}

function ProjectBoard({
  kind,
  log,
}: {
  kind: "revision" | "feedback" | "question";
  log: WorkLogController;
}) {
  const groups = groupTasksByProject(log.day, kind);

  return (
    <div className="space-y-2.5">
      {groups.length === 0 ? (
        <p className="px-0.5 pb-1 text-xs text-muted">Add a project, then tasks under it.</p>
      ) : null}
      {groups.map((group) => (
        <ProjectGroup
          key={group.name}
          name={group.name}
          tasks={group.tasks}
          kind={kind}
          log={log}
        />
      ))}
      <div className="rounded-xl border border-dashed border-border px-2 py-1.5">
        <AddRow
          primaryPlaceholder="New project"
          onAdd={(name) => log.addProject(name, kind)}
          requirePrimary
          hideMinutes
        />
      </div>
    </div>
  );
}

function ProjectGroup({
  name,
  tasks,
  kind,
  log,
}: {
  name: string;
  tasks: TimedLogEntry[];
  kind: "revision" | "feedback" | "question";
  log: WorkLogController;
}) {
  const [expanded, setExpanded] = useState(tasks.length === 0);
  const totalMinutes = tasks.reduce(
    (sum, entry) => sum + durationMsToMinutes(getTimedDurationMs(entry, log.now)),
    0,
  );
  const taskCount = tasks.length;
  const summary = `${taskCount} task${taskCount === 1 ? "" : "s"} · ${formatMinutesShort(totalMinutes)}`;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background/50">
      <div className={cn("flex items-center gap-1 px-1.5 py-1.5", expanded && "border-b border-border")}>
        <IconBtn
          label={expanded ? "Collapse tasks" : "Expand tasks"}
          onClick={() => setExpanded((value) => !value)}
          tone="muted"
        >
          <ChevronIcon expanded={expanded} />
        </IconBtn>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-w-0 flex-1 cursor-pointer rounded-md px-1 py-0.5 text-left hover:bg-background/80"
        >
          <p className="truncate text-sm font-semibold text-text">{name}</p>
          {!expanded ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted">{summary}</p>
          ) : null}
        </button>
        {expanded ? (
          <span className="shrink-0 pr-1 text-[11px] tabular-nums text-muted">
            {formatMinutesShort(totalMinutes)}
          </span>
        ) : null}
        <IconBtn label={`Remove ${name}`} onClick={() => log.removeProject(name, kind)} tone="danger">
          <TrashIcon />
        </IconBtn>
      </div>
      {expanded ? (
        <>
          <ul>
            {tasks.map((entry) => (
              <TaskRow
                key={entry.id}
                entry={entry}
                now={log.now}
                title={entry.taskNo || "Task"}
                onToggle={() => log.togglePause(entry.id)}
                onComplete={() => log.complete(entry.id)}
                onMinutes={(minutes) => log.setMinutes(entry.id, minutes)}
                onRemove={() => log.removeTimed(entry.id)}
              />
            ))}
          </ul>
          <div className="border-t border-border px-2 py-1.5">
            <AddRow
              primaryPlaceholder="Task no"
              onAdd={(taskNo, minutes) =>
                log.addTimed(kind, name, taskNo, { minutes })
              }
              requirePrimary
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function TopicBoard({
  kind,
  log,
}: {
  kind: TimedKind;
  log: WorkLogController;
}) {
  const { timed } = entriesForKind(log.day, kind);
  const placeholder =
    kind === "meeting" ? "Meeting topic" : kind === "investigation" ? "Investigation topic" : "Topic";

  return (
    <div className="space-y-2.5">
      <section className="overflow-hidden rounded-xl border border-border bg-background/50">
        {timed.length === 0 ? (
          <p className="px-2.5 py-2 text-xs text-muted">Nothing yet. Add one below.</p>
        ) : (
          <ul>
            {timed.map((entry) => (
              <TaskRow
                key={entry.id}
                entry={entry}
                now={log.now}
                title={entry.label}
                onToggle={() => log.togglePause(entry.id)}
                onComplete={() => log.complete(entry.id)}
                onMinutes={(minutes) => log.setMinutes(entry.id, minutes)}
                onRemove={() => log.removeTimed(entry.id)}
              />
            ))}
          </ul>
        )}
        <div className="border-t border-border px-2 py-1.5">
          <AddRow
            primaryPlaceholder={placeholder}
            onAdd={(topic, minutes) => log.addTimed(kind, topic, "", { minutes })}
            requirePrimary
          />
        </div>
      </section>
    </div>
  );
}

function ReviewBoard({ log }: { log: WorkLogController }) {
  const projects = projectNamesForKind(log.day, "review");
  const reviews = log.day.reviews;

  return (
    <div className="space-y-2.5">
      <section className="overflow-hidden rounded-xl border border-border bg-background/50">
        {projects.length === 0 ? (
          <p className="px-2.5 py-2 text-xs text-muted">
            Add a project, then enter self-check minutes.
          </p>
        ) : (
          <ul>
            {projects.map((name) => {
              const review = reviews.find(
                (item) => item.projectName.toLowerCase() === name.toLowerCase(),
              );
              return (
                <li
                  key={name}
                  className="flex items-center gap-2 border-b border-border px-2.5 py-1.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                    {name}
                  </span>
                  <MinutesEditor
                    minutes={review?.minutes ?? 0}
                    onCommit={(minutes) => {
                      if (review) {
                        log.updateReview(review.id, minutes);
                        return;
                      }
                      if (minutes > 0) {
                        log.addReview(name, minutes);
                      }
                    }}
                  />
                  {review ? (
                    <IconBtn label="Remove review" onClick={() => log.removeReview(review.id)} tone="danger">
                      <TrashIcon />
                    </IconBtn>
                  ) : (
                    <IconBtn label={`Remove ${name}`} onClick={() => log.removeProject(name, "review")} tone="danger">
                      <TrashIcon />
                    </IconBtn>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-border px-2 py-1.5">
          <AddRow
            primaryPlaceholder="New project"
            minutesPlaceholder="min"
            onAdd={(name, minutes) => {
              log.addProject(name, "review");
              if (minutes > 0) {
                log.addReview(name, minutes);
              }
            }}
            requirePrimary
          />
        </div>
      </section>
    </div>
  );
}

function TaskRow({
  entry,
  now,
  title,
  onToggle,
  onComplete,
  onMinutes,
  onRemove,
}: {
  entry: TimedLogEntry;
  now: number;
  title: string;
  onToggle: () => void;
  onComplete: () => void;
  onMinutes: (minutes: number) => void;
  onRemove: () => void;
}) {
  const ms = getTimedDurationMs(entry, now);
  const minutes = durationMsToMinutes(ms);
  const running = entry.status === "running";
  const done = entry.status === "done";

  return (
    <li
      className={cn(
        "flex items-center gap-1.5 border-b border-border px-2 py-1 last:border-b-0",
        running && "bg-primary/5",
        done && "opacity-80",
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-text",
          done && "text-muted",
        )}
        title={title}
      >
        {title}
      </span>
      {running ? (
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-primary">
          {formatElapsedClock(ms)}
        </span>
      ) : (
        <MinutesEditor minutes={minutes} onCommit={onMinutes} />
      )}
      {running ? (
        <IconBtn label="Pause" onClick={onToggle} tone="primary">
          <PauseIcon />
        </IconBtn>
      ) : done ? null : (
        <IconBtn label="Start" onClick={onToggle} tone="primary">
          <PlayIcon />
        </IconBtn>
      )}
      {done ? (
        <span className="inline-flex h-7 w-7 items-center justify-center text-success" title="Completed">
          <CheckIcon />
        </span>
      ) : (
        <IconBtn label="Complete" onClick={onComplete} tone="success">
          <CheckIcon />
        </IconBtn>
      )}
      <IconBtn label="Remove" onClick={onRemove} tone="danger">
        <TrashIcon />
      </IconBtn>
    </li>
  );
}

function AddRow({
  primaryPlaceholder,
  minutesPlaceholder = "min",
  hideMinutes = false,
  requirePrimary = false,
  onAdd,
}: {
  primaryPlaceholder: string;
  minutesPlaceholder?: string;
  hideMinutes?: boolean;
  requirePrimary?: boolean;
  onAdd: (primary: string, minutes: number) => void;
}) {
  const [primary, setPrimary] = useState("");
  const [minutes, setMinutes] = useState("");

  function submit() {
    const name = primary.trim();
    if (requirePrimary && !name) {
      return;
    }
    const value = minutes.trim() === "" ? 0 : Number(minutes);
    if (minutes.trim() !== "" && (!Number.isFinite(value) || value < 0)) {
      return;
    }
    onAdd(name, value);
    setPrimary("");
    setMinutes("");
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        className={cn(fieldClass, "flex-1")}
        value={primary}
        onChange={(event) => setPrimary(event.target.value)}
        placeholder={primaryPlaceholder}
        aria-label={primaryPlaceholder}
        autoComplete="off"
      />
      {hideMinutes ? null : (
        <input
          className={cn(fieldClass, "w-[3.75rem] text-center tabular-nums")}
          inputMode="numeric"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value.replace(/[^\d.]/g, ""))}
          placeholder={minutesPlaceholder}
          aria-label="Custom minutes"
          title="Custom minutes"
        />
      )}
      <IconBtn label="Add" type="submit" tone="muted" disabled={requirePrimary && !primary.trim()}>
        <PlusIcon />
      </IconBtn>
    </form>
  );
}

function MinutesEditor({
  minutes,
  onCommit,
}: {
  minutes: number;
  onCommit: (minutes: number) => void;
}) {
  const display = minutes > 0 ? String(roundLiveMinutes(minutes)) : "";
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(display);

  useEffect(() => {
    if (!editing) {
      setText(display);
    }
  }, [display, editing]);

  function commit() {
    const next = text.trim() === "" ? 0 : Number(text);
    setEditing(false);
    if (!Number.isFinite(next) || next < 0) {
      setText(display);
      return;
    }
    if (roundLiveMinutes(next) !== roundLiveMinutes(minutes)) {
      onCommit(next);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex h-7 min-w-[2.75rem] cursor-pointer items-center justify-end rounded-md px-1.5 font-mono text-[11px] tabular-nums text-muted hover:bg-background hover:text-text"
        title="Edit minutes"
        aria-label="Edit minutes"
      >
        {minutes > 0 ? formatMinutesShort(minutes) : "0 min"}
      </button>
    );
  }

  return (
    <input
      autoFocus
      className={cn(fieldClass, "w-[3.75rem] text-center tabular-nums")}
      inputMode="numeric"
      value={text}
      onChange={(event) => setText(event.target.value.replace(/[^\d.]/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setText(display);
          setEditing(false);
        }
      }}
      aria-label="Custom minutes"
    />
  );
}

function IconBtn({
  label,
  onClick,
  children,
  tone = "muted",
  type = "button",
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  tone?: "muted" | "primary" | "success" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tone === "muted" && "text-muted hover:bg-background hover:text-text",
        tone === "primary" && "text-primary hover:bg-primary/10",
        tone === "success" && "text-success hover:bg-success/10",
        tone === "danger" && "text-danger hover:bg-danger/10",
      )}
    >
      {children}
    </button>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
    </svg>
  );
}

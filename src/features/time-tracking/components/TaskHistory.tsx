import { memo, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  formatDisplayDate,
  getLocalRetentionCutoffIso,
} from "@/lib/date";
import { formatDurationLabel, formatMinutesShort } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { listCompletedHistory, type HistoryProject } from "../history";
import { TIME_TRACKING_RETENTION_DAYS } from "../types";
import type { TimeTrackingStore } from "../types";

type FilterMode = "all" | "custom";

interface TaskHistoryProps {
  store: TimeTrackingStore;
  today: string;
}

function clampIso(value: string, min: string, max: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return max;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function InfoIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v6M12 8h.01" />
    </svg>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 cursor-pointer rounded-xl px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-background text-muted ring-1 ring-border hover:bg-surface hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export const TaskHistory = memo(function TaskHistory({
  store,
  today,
}: TaskHistoryProps) {
  const cutoff = getLocalRetentionCutoffIso(TIME_TRACKING_RETENTION_DAYS, today);
  const [mode, setMode] = useState<FilterMode>("all");
  const [customRange, setCustomRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState<HistoryProject | null>(null);

  const range = useMemo(() => {
    if (mode === "custom" && customRange) {
      const from = clampIso(customRange.from, cutoff, today);
      const to = clampIso(customRange.to, cutoff, today);
      return from <= to ? { from, to } : { from: to, to: from };
    }
    return { from: cutoff, to: today };
  }, [mode, customRange, cutoff, today]);

  const history = useMemo(
    () => listCompletedHistory(store, range.from, range.to),
    [store, range.from, range.to],
  );

  const rangeLabel =
    range.from === range.to
      ? formatDisplayDate(range.from)
      : `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text sm:text-lg">
                Completed work
              </h2>
              <p className="mt-1 text-sm text-muted">
                Last {TIME_TRACKING_RETENTION_DAYS} days in this browser. Choose
                Custom Date to pick a range.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex min-h-8 items-center rounded-lg bg-background px-2.5 text-xs font-medium text-text ring-1 ring-border">
                {history.projectCount} project
                {history.projectCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex min-h-8 items-center rounded-lg bg-background px-2.5 text-xs font-medium text-text ring-1 ring-border">
                {history.taskCount} task{history.taskCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex min-h-8 items-center rounded-lg bg-primary/10 px-2.5 text-xs font-medium text-primary ring-1 ring-primary/20">
                {formatMinutesShort(history.totalMinutes)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Date filter">
            <FilterChip
              active={mode === "all"}
              onClick={() => {
                setMode("all");
                setPickerOpen(false);
              }}
            >
              Last 30 days
            </FilterChip>
            <FilterChip
              active={mode === "custom"}
              onClick={() => {
                setMode("custom");
                setPickerOpen(true);
              }}
            >
              Custom Date
            </FilterChip>
          </div>

          {mode === "custom" ? (
            <div className="max-w-lg">
              <DateRangePicker
                id="history-custom-date"
                from={customRange?.from ?? null}
                to={customRange?.to ?? null}
                min={cutoff}
                max={today}
                today={today}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onChange={(from, to) => {
                  setCustomRange({ from, to });
                }}
              />
            </div>
          ) : (
            <p className="text-xs text-muted">{rangeLabel}</p>
          )}
        </div>
      </Card>

      {history.days.length === 0 ? (
        <EmptyState
          title="No completed projects"
          description="Finish a task on Time Tracking and it will appear here. Try another date if you already have older work."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {history.days.map((day) => (
            <section key={day.date} className="space-y-2">
              <div className="sticky top-[4.5rem] z-10 -mx-1 flex items-baseline justify-between gap-3 rounded-xl bg-background/90 px-1 py-1.5 backdrop-blur-md sm:top-20">
                <h3 className="text-sm font-semibold text-text">
                  {formatDisplayDate(day.date)}
                  {day.date === today ? (
                    <span className="ml-2 text-xs font-medium text-primary">
                      Today
                    </span>
                  ) : null}
                </h3>
                <p className="text-xs text-muted">
                  {day.projects.length} project
                  {day.projects.length === 1 ? "" : "s"} · {day.taskCount} task
                  {day.taskCount === 1 ? "" : "s"} · {day.totalLabel}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {day.projects.map((project) => (
                  <Card
                    key={`${day.date}-${project.projectId}`}
                    className="p-4 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">
                          {project.name}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          {project.caseNo ? `Case No ${project.caseNo} · ` : null}
                          {formatMinutesShort(project.totalMinutes)}
                          <span className="hidden sm:inline">
                            {" "}
                            · {formatDurationLabel(
                              String(Math.round(project.totalMinutes)),
                              false,
                            )}
                          </span>
                        </p>
                      </div>
                      {project.note ? (
                        <button
                          type="button"
                          onClick={() => setNote(project)}
                          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-primary/25"
                          aria-label={`View note for ${project.name}`}
                          title="View project note"
                        >
                          <InfoIcon />
                        </button>
                      ) : null}
                    </div>
                    <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {project.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-3 bg-background/60 px-3 py-2.5"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="rounded-lg bg-surface px-2 py-0.5 font-mono text-sm font-semibold text-text ring-1 ring-border">
                              {task.number}
                            </span>
                            <Badge variant="success">Completed</Badge>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-muted">
                            {formatMinutesShort(task.minutes)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(note)}
        title={note ? `Note · ${note.name}` : "Note"}
        onClose={() => setNote(null)}
        panelClassName="max-w-lg"
        footer={
          <Button variant="secondary" onClick={() => setNote(null)}>
            Close
          </Button>
        }
      >
        <div className="max-h-[min(50vh,22rem)] overflow-y-auto rounded-xl border border-border bg-background px-3.5 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {note?.note}
          </p>
        </div>
      </Modal>
    </div>
  );
});

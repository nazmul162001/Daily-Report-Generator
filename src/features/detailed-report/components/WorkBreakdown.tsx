import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import {
  SortableList,
  type DragHandleBind,
} from "@/components/ui/SortableList";
import { durationMsToMinutes, formatElapsedClock } from "@/features/time-tracking/timer";
import { kindFromCategory } from "@/features/work-log/categories";
import { getTimedDurationMs } from "@/features/work-log/timer";
import {
  liveMinutesForKind,
  minutesToInput,
  roundLiveMinutes,
  topicMinutes,
  topicsForBreakdown,
} from "@/features/work-log/totals";
import type { TimedKind, TimedLogEntry } from "@/features/work-log/types";
import type { WorkLogController } from "@/features/work-log/useWorkLog";
import {
  formatDurationInput,
  formatMinutesShort,
  parseDurationInput,
  parseMinutes,
  type DurationUnit,
} from "@/lib/duration";
import { createId, cn } from "@/lib/utils";
import type { WorkBreakdownItem } from "@/types/common";
import { useEffect, useRef, useState } from "react";

interface WorkBreakdownProps {
  items: WorkBreakdownItem[];
  error?: string;
  log: WorkLogController;
  onChange: (items: WorkBreakdownItem[]) => void;
}

function topicKind(category: string): TimedKind {
  const kind = kindFromCategory(category);
  return kind === "review" ? "custom" : kind;
}

function DurationUnitToggle({
  unit,
  label,
  onChange,
}: {
  unit: DurationUnit;
  label: string;
  onChange: (unit: DurationUnit) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-2 rounded-md bg-background p-0.5 text-[10px] font-semibold leading-none"
    >
      {(
        [
          ["minutes", "min"],
          ["hours", "hr"],
        ] as const
      ).map(([option, text]) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          title={option === "minutes" ? "Minutes" : "Hours"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-1 py-1",
            unit === option ? "bg-primary text-on-primary" : "text-muted hover:text-text",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function AddTopicButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 self-stretch whitespace-nowrap border-l border-border px-2.5 text-[11px] font-semibold text-muted transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
      Add Topic
    </button>
  );
}

function TopicRow({
  entry,
  now,
  autoFocus,
  onRename,
  onToggle,
  onMinutes,
  onRemove,
}: {
  entry: TimedLogEntry;
  now: number;
  autoFocus: boolean;
  onRename: (label: string) => void;
  onToggle: () => void;
  onMinutes: (minutes: number) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const nameFocused = useRef(false);
  const timeEdited = useRef(false);
  const selectTime = useRef(false);
  const [name, setName] = useState(entry.label);
  const ms = getTimedDurationMs(entry, now);
  const minutes = durationMsToMinutes(ms);
  const running = entry.status === "running";
  const [editingTime, setEditingTime] = useState(false);
  const [showTimeUnit, setShowTimeUnit] = useState(false);
  const [timeUnit, setTimeUnit] = useState<DurationUnit>("minutes");
  const [timeText, setTimeText] = useState(minutes > 0 ? String(roundLiveMinutes(minutes)) : "0");

  useEffect(() => {
    if (!nameFocused.current) {
      setName(entry.label);
    }
  }, [entry.label]);

  useEffect(() => {
    if (autoFocus) {
      nameFocused.current = true;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [autoFocus]);

  function commitName(raw: string) {
    const next = raw.replace(/\s+/g, " ").trim();
    if (!next) {
      setName(entry.label);
      return entry.label;
    }
    setName(next);
    if (next !== entry.label) {
      onRename(next);
    }
    return next;
  }

  useEffect(() => {
    if (!editingTime) {
      setTimeText(minutes > 0 ? String(roundLiveMinutes(minutes)) : "0");
    }
  }, [minutes, editingTime]);

  useEffect(() => {
    if (!selectTime.current || !editingTime) {
      return;
    }
    selectTime.current = false;
    timeInputRef.current?.focus();
    timeInputRef.current?.select();
  }, [editingTime, timeText, timeUnit]);

  function openTimeEditor() {
    timeEdited.current = false;
    setShowTimeUnit(false);
    setTimeUnit("minutes");
    setTimeText(minutes > 0 ? String(roundLiveMinutes(minutes)) : "");
    selectTime.current = true;
    setEditingTime(true);
  }

  function switchTimeUnit(next: DurationUnit) {
    if (next === timeUnit) {
      return;
    }
    if (!timeEdited.current) {
      setTimeText(formatDurationInput(minutes, next));
      selectTime.current = true;
    }
    setTimeUnit(next);
  }

  function commitTime() {
    const next = parseDurationInput(timeText, timeUnit);
    setEditingTime(false);
    setShowTimeUnit(false);
    setTimeUnit("minutes");
    timeEdited.current = false;
    if (next == null) {
      return;
    }
    if (roundLiveMinutes(next) !== roundLiveMinutes(minutes)) {
      onMinutes(next);
    }
  }

  return (
    <li
      className={cn(
        "flex items-center gap-1.5 rounded-xl border border-border bg-background/50 px-2 py-1.5",
        running && "border-primary/40 bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-primary hover:bg-primary/10"
        aria-label={running ? "Pause topic timer" : "Start topic timer"}
        title={running ? "Pause" : "Start"}
      >
        {running ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        value={name}
        onFocus={() => {
          nameFocused.current = true;
        }}
        onBlur={() => {
          nameFocused.current = false;
          commitName(name);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setName(next);
          if (next.trim()) {
            onRename(next);
          }
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key !== "Enter") {
            return;
          }
          event.preventDefault();
          nameFocused.current = false;
          const next = commitName(event.currentTarget.value);
          if (!running && next.trim()) {
            onToggle();
          }
        }}
        aria-label="Topic name"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-text focus:outline-none"
      />
      {running ? (
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-primary">
          {formatElapsedClock(ms)}
        </span>
      ) : editingTime ? (
        <div className="flex shrink-0 items-center gap-1">
          <input
            ref={timeInputRef}
            autoFocus
            inputMode="decimal"
            value={timeText}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              timeEdited.current = true;
              setShowTimeUnit(true);
              setTimeText(event.target.value.replace(/[^\d.]/g, ""));
            }}
            onBlur={commitTime}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            aria-label="Edit time"
            title="Type the number, then choose min or hr."
            placeholder="0"
            className="h-7 w-14 rounded-md border border-border bg-surface text-center font-mono text-[11px] tabular-nums text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
          />
          {showTimeUnit ? (
            <DurationUnitToggle unit={timeUnit} label="Topic time unit" onChange={switchTimeUnit} />
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={openTimeEditor}
          className="inline-flex h-7 min-w-[3.25rem] cursor-pointer items-center justify-end rounded-md px-1.5 font-mono text-[11px] tabular-nums text-muted hover:bg-surface hover:text-text"
          title="Edit time"
        >
          {minutes > 0 ? `${roundLiveMinutes(minutes)} min` : "0"}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-danger hover:bg-danger/10"
        aria-label="Delete topic"
        title="Delete topic"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
        </svg>
      </button>
    </li>
  );
}

function WorkBreakdownRow({
  item,
  index,
  total,
  topics,
  focusTopicId,
  now,
  liveMinutes,
  drag,
  onAddTopic,
  onUpdate,
  onRemove,
  onUseLive,
  onRenameTopic,
  onToggleTopic,
  onTopicMinutes,
  onRemoveTopic,
}: {
  item: WorkBreakdownItem;
  index: number;
  total: number;
  topics: TimedLogEntry[];
  focusTopicId: string | null;
  now: number;
  liveMinutes: number;
  drag: DragHandleBind;
  onAddTopic: () => void;
  onUpdate: (patch: Partial<WorkBreakdownItem>) => void;
  onRemove: () => void;
  onUseLive: () => void;
  onRenameTopic: (id: string, label: string) => void;
  onToggleTopic: (id: string) => void;
  onTopicMinutes: (id: string, minutes: number) => void;
  onRemoveTopic: (id: string) => void;
}) {
  const hasLive = liveMinutes > 0;
  const locked = Boolean(item.minutesLocked);
  const displayMinutes = locked
    ? item.minutes
    : hasLive
      ? minutesToInput(liveMinutes)
      : "0";
  const topicCount = topics.length;
  const [draftMinutes, setDraftMinutes] = useState<string | null>(null);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [unit, setUnit] = useState<DurationUnit>("minutes");
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const minutesFocused = useRef(false);
  const minutesEdited = useRef(false);
  const selectMinutes = useRef(false);
  const confirmingRef = useRef(false);
  const [confirmingManual, setConfirmingManual] = useState(false);
  const storedMinutes = parseMinutes(displayMinutes) ?? 0;
  const shownMinutes =
    draftMinutes ?? (storedMinutes > 0 ? formatDurationInput(storedMinutes, "minutes") : "");

  useEffect(() => {
    if (!selectMinutes.current) {
      return;
    }
    selectMinutes.current = false;
    minutesFocused.current = true;
    minutesInputRef.current?.focus();
    minutesInputRef.current?.select();
  }, [draftMinutes, unit]);

  function applyManualMinutes(raw: string) {
    onUpdate({ minutes: raw, isNA: false, minutesLocked: true });
    setDraftMinutes(null);
    setUnitPickerOpen(false);
    setUnit("minutes");
    minutesEdited.current = false;
  }

  function switchUnit(next: DurationUnit) {
    if (next === unit) {
      return;
    }
    if (!minutesEdited.current) {
      setDraftMinutes(formatDurationInput(storedMinutes, next));
      selectMinutes.current = true;
    }
    setUnit(next);
  }

  function commitParentTime(raw: string) {
    if (confirmingRef.current) {
      return;
    }
    const minutes = parseDurationInput(raw, unit);
    minutesEdited.current = false;
    setUnitPickerOpen(false);
    if (minutes == null) {
      setDraftMinutes(null);
      setUnit("minutes");
      return;
    }
    const asText = minutes <= 0 ? "0" : minutesToInput(minutes);
    const current = parseMinutes(displayMinutes) ?? 0;
    if (roundLiveMinutes(minutes) === roundLiveMinutes(current)) {
      setDraftMinutes(null);
      setUnit("minutes");
      return;
    }
    if (topicCount === 0) {
      applyManualMinutes(asText);
      return;
    }
    confirmingRef.current = true;
    setUnit("minutes");
    setDraftMinutes(asText);
    setConfirmingManual(true);
  }

  function confirmManualMinutes() {
    for (const topic of topics) {
      onRemoveTopic(topic.id);
    }
    applyManualMinutes(draftMinutes ?? "");
    confirmingRef.current = false;
    setConfirmingManual(false);
  }

  function cancelManualMinutes() {
    confirmingRef.current = false;
    setConfirmingManual(false);
    setDraftMinutes(null);
  }

  return (
    <div className="w-full rounded-xl border border-border bg-background/50 p-3 transition-colors sm:border-0 sm:bg-transparent sm:p-0">
      <div className="work-breakdown-row">
        <DragHandle
          className="work-breakdown-row__drag h-auto w-8 self-stretch rounded-lg"
          {...drag.attributes}
          {...drag.listeners}
        />

        <div className="work-breakdown-row__category flex overflow-hidden rounded-xl border border-border bg-surface hover:border-primary/35">
          <div className="min-w-0 flex-1">
            <Input
              id={`wb-category-${item.id}`}
              value={item.category}
              onChange={(event) => onUpdate({ category: event.target.value })}
              placeholder="Category"
              aria-label={`Category ${index + 1}`}
              className="min-h-11 border-0 bg-transparent shadow-none focus:ring-0"
            />
            <p className="px-3.5 pb-2.5 text-xs font-normal text-muted">
              {locked
                ? "Custom minutes"
                : topicCount > 0
                  ? `${topicCount} topic${topicCount === 1 ? "" : "s"} · ${formatMinutesShort(liveMinutes)}`
                  : hasLive
                    ? `${formatMinutesShort(liveMinutes)} logged`
                    : "Add a topic to track time"}
            </p>
          </div>
          <AddTopicButton onClick={onAddTopic} />
        </div>

        <div className="work-breakdown-row__minutes flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-1 items-center justify-center px-1.5 pt-1.5">
            <input
              ref={minutesInputRef}
              id={`wb-minutes-${item.id}`}
              inputMode="decimal"
              value={shownMinutes}
              onFocus={(event) => {
                if (!minutesFocused.current) {
                  minutesFocused.current = true;
                  minutesEdited.current = false;
                  setUnitPickerOpen(false);
                  setUnit("minutes");
                  setDraftMinutes(
                    storedMinutes > 0 ? formatDurationInput(storedMinutes, "minutes") : "",
                  );
                }
                event.currentTarget.select();
              }}
              onBlur={(event) => {
                minutesFocused.current = false;
                setUnitPickerOpen(false);
                commitParentTime(event.currentTarget.value.replace(/[^\d.]/g, ""));
              }}
              onChange={(event) => {
                minutesEdited.current = true;
                setUnitPickerOpen(true);
                setDraftMinutes(event.target.value.replace(/[^\d.]/g, ""));
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }
                event.preventDefault();
                event.currentTarget.blur();
              }}
              placeholder="0"
              aria-label={`Time ${index + 1}`}
              title="Type the number, then choose min or hr."
              className="w-full min-w-0 border-0 bg-transparent text-center text-base font-semibold tabular-nums text-text placeholder:text-muted/50 focus:outline-none sm:text-sm"
            />
          </div>
          {unitPickerOpen ? (
            <div className="px-1.5 pb-1.5">
              <DurationUnitToggle
                unit={unit}
                label={`Time unit ${index + 1}`}
                onChange={switchUnit}
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          className="work-breakdown-row__delete box-border flex cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-danger transition-colors hover:border-danger/30 hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Remove row ${index + 1}`}
          title="Remove row"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
            <path strokeLinecap="round" d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {topicCount > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5 sm:ml-10">
          {topics.map((entry) => (
            <TopicRow
              key={entry.id}
              entry={entry}
              now={now}
              autoFocus={focusTopicId === entry.id}
              onRename={(label) => onRenameTopic(entry.id, label)}
              onToggle={() => onToggleTopic(entry.id)}
              onMinutes={(minutes) => onTopicMinutes(entry.id, minutes)}
              onRemove={() => onRemoveTopic(entry.id)}
            />
          ))}
        </ul>
      ) : null}

      {locked && hasLive ? (
        <button
          type="button"
          onClick={onUseLive}
          className="mt-2 cursor-pointer text-xs font-medium text-primary hover:underline"
        >
          Use live time ({formatMinutesShort(liveMinutes)})
        </button>
      ) : null}

      <ConfirmDialog
        open={confirmingManual}
        title="Remove topics?"
        description="If you add time manually, all topics for this category will be removed."
        confirmLabel="OK"
        cancelLabel="Cancel"
        onConfirm={confirmManualMinutes}
        onCancel={cancelManualMinutes}
      />
    </div>
  );
}

export function WorkBreakdown({
  items,
  error,
  log,
  onChange,
}: WorkBreakdownProps) {
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<WorkBreakdownItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addRow() {
    onChange([
      ...items,
      {
        id: createId("wb"),
        category: "",
        minutes: "0",
        isNA: false,
      },
    ]);
  }

  function removeRow(id: string) {
    if (items.length <= 1) {
      return;
    }
    for (const topic of topicsForBreakdown(log.day, id)) {
      log.removeTimed(topic.id);
    }
    onChange(items.filter((item) => item.id !== id));
  }

  function addTopic(item: WorkBreakdownItem) {
    const entryId = log.addTopic(item.id, topicKind(item.category), "New topic");
    if (!entryId) {
      return;
    }
    setFocusTopicId(entryId);
    if (item.minutesLocked || item.isNA) {
      updateItem(item.id, { minutesLocked: false, isNA: false });
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">Work Breakdown</h3>
          <p className="text-xs text-muted">
            Add a topic under a category, then start its timer. Type a number and choose min or hr.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={addRow}
          className="w-full shrink-0 sm:w-auto"
        >
          + Add row
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

      <SortableList
        items={items}
        onReorder={onChange}
        ariaLabel="Work breakdown items"
        className="gap-2.5 sm:gap-2"
        renderItem={(item, index, drag) => {
          const topics = topicsForBreakdown(log.day, item.id);
          const live = roundLiveMinutes(
            topics.length > 0
              ? topicMinutes(log.day, item.id, log.now)
              : liveMinutesForKind(log.day, kindFromCategory(item.category), log.now),
          );
          return (
            <WorkBreakdownRow
              item={item}
              index={index}
              total={items.length}
              topics={topics}
              focusTopicId={focusTopicId}
              now={log.now}
              liveMinutes={live}
              drag={drag}
              onAddTopic={() => addTopic(item)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeRow(item.id)}
              onUseLive={() =>
                updateItem(item.id, {
                  minutesLocked: false,
                  isNA: false,
                  minutes: minutesToInput(live),
                })
              }
              onRenameTopic={log.renameTopic}
              onToggleTopic={log.togglePause}
              onTopicMinutes={log.setMinutes}
              onRemoveTopic={log.removeTimed}
            />
          );
        }}
      />
    </section>
  );
}

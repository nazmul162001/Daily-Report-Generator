import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { Input } from "@/components/ui/Input";
import {
  SortableList,
  type DragHandleBind,
} from "@/components/ui/SortableList";
import { formatMinutesShort } from "@/lib/duration";
import { createId, cn } from "@/lib/utils";
import type { WorkBreakdownItem } from "@/types/common";
import { kindFromCategory } from "@/features/work-log/categories";
import { liveMinutesForKind, minutesToInput, roundLiveMinutes } from "@/features/work-log/totals";
import type { WorkLogDay } from "@/features/work-log/types";

interface WorkBreakdownProps {
  items: WorkBreakdownItem[];
  error?: string;
  selectedId: string | null;
  logDay: WorkLogDay;
  now: number;
  onSelect: (id: string) => void;
  onChange: (items: WorkBreakdownItem[]) => void;
}

function OpenLogButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open work log for ${label}`}
      aria-pressed={selected}
      title="Open work log panel"
      className={cn(
        "flex w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch border-l px-2 py-2 transition-colors sm:px-2.5",
        selected
          ? "border-primary/35 bg-primary/15 text-primary"
          : "border-border text-muted hover:bg-primary/10 hover:text-primary",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M9 4v16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10l3 2-3 2" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wide">Log</span>
    </button>
  );
}

function WorkBreakdownRow({
  item,
  index,
  total,
  selected,
  liveMinutes,
  drag,
  onSelect,
  onUpdate,
  onRemove,
  onUseLive,
}: {
  item: WorkBreakdownItem;
  index: number;
  total: number;
  selected: boolean;
  liveMinutes: number;
  drag: DragHandleBind;
  onSelect: () => void;
  onUpdate: (patch: Partial<WorkBreakdownItem>) => void;
  onRemove: () => void;
  onUseLive: () => void;
}) {
  const hasLive = liveMinutes > 0;
  const locked = Boolean(item.minutesLocked);
  const displayMinutes =
    locked || !hasLive
      ? locked
        ? item.minutes
        : item.minutes || "0"
      : minutesToInput(liveMinutes);

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-background/50 p-3 transition-colors sm:border-0 sm:bg-transparent sm:p-0",
        selected ? "border-primary/50 ring-2 ring-primary/20 sm:ring-0" : "border-border",
      )}
    >
      {/*
        One explicit CSS grid (.work-breakdown-row in global.css) for drag +
        category + minutes + delete. Avoids flex-wrap and display:contents, which
        break after Astro ClientRouter page swaps.
      */}
      <div className="work-breakdown-row">
        <DragHandle
          className="work-breakdown-row__drag h-auto w-8 self-stretch rounded-lg"
          {...drag.attributes}
          {...drag.listeners}
        />

        <div
          className={cn(
            "work-breakdown-row__category flex overflow-hidden rounded-xl border",
            selected
              ? "border-primary/50 bg-primary/10"
              : "border-border bg-surface hover:border-primary/35",
          )}
        >
          <div className="min-w-0 flex-1">
            <Input
              id={`wb-category-${item.id}`}
              value={item.category}
              onChange={(event) => onUpdate({ category: event.target.value })}
              onFocus={onSelect}
              placeholder="Category"
              aria-label={`Category ${index + 1}`}
              className="min-h-11 border-0 bg-transparent shadow-none focus:ring-0"
            />
            <p className="px-3.5 pb-2.5 text-xs font-normal text-muted">
              {locked
                ? "Custom minutes"
                : hasLive
                  ? `${formatMinutesShort(liveMinutes)} logged`
                  : "Tap Log to add work"}
            </p>
          </div>
          <OpenLogButton
            selected={selected}
            label={item.category.trim() || `row ${index + 1}`}
            onClick={onSelect}
          />
        </div>

        <div className="work-breakdown-row__minutes flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-1 items-center justify-center px-2 pt-2">
            <input
              id={`wb-minutes-${item.id}`}
              inputMode="numeric"
              value={displayMinutes}
              onChange={(event) => {
                const raw = event.target.value.replace(/[^\d.]/g, "");
                onUpdate({ minutes: raw, isNA: false, minutesLocked: true });
              }}
              placeholder="0"
              aria-label={`Minutes ${index + 1}`}
              title="Type custom minutes. Live time fills this unless you edit it."
              className="w-full min-w-0 border-0 bg-transparent text-center text-base font-semibold tabular-nums text-text placeholder:text-muted/50 focus:outline-none sm:text-sm"
            />
          </div>
          <p className="px-2 pb-2.5 text-center text-xs font-normal text-muted">
            Minutes
          </p>
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

      {locked && hasLive ? (
        <button
          type="button"
          onClick={onUseLive}
          className="mt-2 cursor-pointer text-xs font-medium text-primary hover:underline"
        >
          Use live time ({formatMinutesShort(liveMinutes)})
        </button>
      ) : null}
    </div>
  );
}

export function WorkBreakdown({
  items,
  error,
  selectedId,
  logDay,
  now,
  onSelect,
  onChange,
}: WorkBreakdownProps) {
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
    onChange(items.filter((item) => item.id !== id));
    if (selectedId === id) {
      onSelect(items.find((item) => item.id !== id)?.id ?? "");
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">Work Breakdown</h3>
          <p className="text-xs text-muted">
            Click <span className="font-medium text-text">Log</span> on a category to
            open the work panel.
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
          const kind = kindFromCategory(item.category);
          const live = roundLiveMinutes(liveMinutesForKind(logDay, kind, now));
          return (
            <WorkBreakdownRow
              item={item}
              index={index}
              total={items.length}
              selected={selectedId === item.id}
              liveMinutes={live}
              drag={drag}
              onSelect={() => onSelect(item.id)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeRow(item.id)}
              onUseLive={() =>
                updateItem(item.id, {
                  minutesLocked: false,
                  isNA: false,
                  minutes: minutesToInput(live),
                })
              }
            />
          );
        }}
      />
    </section>
  );
}

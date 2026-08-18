import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  SortableList,
  SortableRowLayout,
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

function WorkBreakdownRow({
  item,
  index,
  total,
  selected,
  liveMinutes,
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
  onSelect: () => void;
  onUpdate: (patch: Partial<WorkBreakdownItem>) => void;
  onRemove: () => void;
  onUseLive: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.category);
  const nameRef = useRef<HTMLInputElement>(null);
  const hasLive = liveMinutes > 0;
  const locked = Boolean(item.minutesLocked);
  const displayMinutes =
    locked || !hasLive
      ? locked
        ? item.minutes
        : item.minutes || "0"
      : minutesToInput(liveMinutes);

  useEffect(() => {
    if (!editing) {
      setDraft(item.category);
    }
  }, [item.category, editing]);

  useEffect(() => {
    if (!editing) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editing]);

  function commitName() {
    const next = draft.trim();
    setEditing(false);
    if (!next) {
      setDraft(item.category);
      return;
    }
    if (next !== item.category) {
      onUpdate({ category: next });
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-background/50 p-3 transition-colors sm:border-0 sm:bg-transparent sm:p-0",
        selected ? "border-primary/50 ring-2 ring-primary/20 sm:ring-0" : "border-border",
      )}
    >
      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[1fr_minmax(5.75rem,7rem)_auto] sm:items-center sm:gap-2">
        {item.category.trim() || editing ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }}
            className={cn(
              "min-h-11 cursor-pointer rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
              selected
                ? "border-primary/50 bg-primary/10 text-text"
                : "border-border bg-surface text-text hover:border-primary/35",
            )}
          >
            {editing ? (
              <input
                ref={nameRef}
                value={draft}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitName();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setDraft(item.category);
                    setEditing(false);
                  }
                }}
                aria-label={`Rename category ${index + 1}`}
                className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1 text-sm font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <span
                className="inline-block max-w-full cursor-text rounded-sm decoration-primary/40 decoration-dotted underline-offset-4 hover:underline"
                title="Click the name to rename"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(true);
                }}
              >
                {item.category}
              </span>
            )}
            <span className="mt-0.5 block text-xs font-normal text-muted">
              {locked
                ? "Custom minutes"
                : hasLive
                  ? `${formatMinutesShort(liveMinutes)} logged`
                  : "Open to add work"}
            </span>
          </div>
        ) : (
          <Input
            id={`wb-category-${item.id}`}
            value={item.category}
            onChange={(event) => onUpdate({ category: event.target.value })}
            onFocus={onSelect}
            placeholder="Category"
            aria-label={`Category ${index + 1}`}
          />
        )}

        <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:contents">
          <Input
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
            className="min-h-11"
          />

          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Remove row ${index + 1}`}
            title="Remove row"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
              <path strokeLinecap="round" d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
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
            Tap a category to log work. Click the name to rename it.
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
            <SortableRowLayout drag={drag}>
              <WorkBreakdownRow
                item={item}
                index={index}
                total={items.length}
                selected={selectedId === item.id}
                liveMinutes={live}
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
            </SortableRowLayout>
          );
        }}
      />
    </section>
  );
}

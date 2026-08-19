import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addLocalDays,
  addYearMonths,
  compareYearMonths,
  formatDisplayDate,
  formatMonthYear,
  getMonthGrid,
  getYearMonth,
  type YearMonth,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PLACEHOLDER = "DD-MM-YYYY ~ DD-MM-YYYY";

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  min: string;
  max: string;
  today: string;
  onChange: (from: string, to: string) => void;
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

function orderRange(start: string, end: string): { from: string; to: string } {
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

function formatHoverLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) {
    return iso;
  }
  return new Date(year, month - 1, day).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function defaultViewMonths(todayIso: string, maxIso: string): {
  left: YearMonth;
  right: YearMonth;
} {
  const current = getYearMonth(todayIso);
  const next = addYearMonths(current, 1);
  if (compareYearMonths(next, getYearMonth(maxIso)) > 0) {
    return { left: addYearMonths(current, -1), right: current };
  }
  return { left: current, right: next };
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
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
      {direction === "prev" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

function DayCell({
  iso,
  day,
  inMonth,
  disabled,
  isToday,
  isAnchor,
  isCommittedEnd,
  isHoverCursor,
  inRange,
  barFrom,
  barTo,
  showTooltip,
  onSelect,
  onHover,
}: {
  iso: string;
  day: number;
  inMonth: boolean;
  disabled: boolean;
  isToday: boolean;
  isAnchor: boolean;
  isCommittedEnd: boolean;
  isHoverCursor: boolean;
  inRange: boolean;
  barFrom: boolean;
  barTo: boolean;
  showTooltip: boolean;
  onSelect: (iso: string) => void;
  onHover: (iso: string) => void;
}) {
  const filled = isAnchor || isCommittedEnd;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(iso)}
      onPointerEnter={() => {
        if (!disabled) {
          onHover(iso);
        }
      }}
      className={cn(
        "relative flex h-9 w-full items-center justify-center text-sm tabular-nums",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      {inRange ? (
        <span className="absolute inset-y-[5px] inset-x-0 bg-primary/20" />
      ) : null}
      {barFrom ? (
        <span className="absolute inset-y-[5px] left-1/2 right-0 bg-primary/20" />
      ) : null}
      {barTo ? (
        <span className="absolute inset-y-[5px] left-0 right-1/2 bg-primary/20" />
      ) : null}

      <span
        className={cn(
          "relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent",
          !inMonth && !filled && "text-muted/40",
          inMonth && !filled && !disabled && "text-text",
          disabled && "opacity-30",
          filled && "border-primary bg-primary font-semibold text-on-primary",
          isToday && !filled && "border-primary",
          isHoverCursor && "border-border bg-background",
        )}
      >
        {day}
      </span>

      {showTooltip ? (
        <span className="pointer-events-none absolute top-full z-20 mt-1 whitespace-nowrap rounded-md bg-tooltip-bg px-2 py-1 text-[11px] font-medium text-tooltip-fg shadow-lg">
          {formatHoverLabel(iso)}
        </span>
      ) : null}
    </button>
  );
}

function MonthCalendar({
  yearMonth,
  min: minIso,
  max: maxIso,
  today,
  anchor,
  cursor,
  committed,
  hover,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSelect,
  onHover,
}: {
  yearMonth: YearMonth;
  min: string;
  max: string;
  today: string;
  anchor: string | null;
  cursor: string | null;
  committed: boolean;
  hover: string | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (iso: string) => void;
  onHover: (iso: string) => void;
}) {
  const cells = useMemo(() => getMonthGrid(yearMonth), [yearMonth]);
  const range = anchor && cursor ? orderRange(anchor, cursor) : null;

  return (
    <div className="min-w-0 flex-1 px-2 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
        >
          <Chevron direction="prev" />
        </button>
        <p className="text-sm font-semibold text-text">
          {formatMonthYear(yearMonth)}
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next month"
        >
          <Chevron direction="next" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="flex h-8 items-center justify-center text-[11px] font-medium text-muted"
          >
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          const disabled = cell.iso < minIso || cell.iso > maxIso;
          const isAnchor = anchor === cell.iso;
          const isCommittedEnd = committed && cursor === cell.iso && !isAnchor;
          const isHoverCursor =
            !committed && hover === cell.iso && !isAnchor && !disabled;
          const inRange = Boolean(
            range && cell.iso > range.from && cell.iso < range.to,
          );
          const spanned = Boolean(range && range.from !== range.to);
          const isEndpoint = isAnchor || isCommittedEnd || isHoverCursor;
          const barFrom = Boolean(
            spanned && cell.iso === range?.from && isEndpoint,
          );
          const barTo = Boolean(
            spanned && cell.iso === range?.to && isEndpoint,
          );

          return (
            <DayCell
              key={cell.iso}
              iso={cell.iso}
              day={cell.day}
              inMonth={cell.inMonth}
              disabled={disabled}
              isToday={cell.iso === today}
              isAnchor={isAnchor}
              isCommittedEnd={isCommittedEnd}
              isHoverCursor={isHoverCursor}
              inRange={inRange}
              barFrom={barFrom}
              barTo={barTo}
              showTooltip={isHoverCursor}
              onSelect={onSelect}
              onHover={onHover}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  from,
  to,
  min,
  max,
  today,
  onChange,
  id,
  open: openProp,
  onOpenChange,
}: DateRangePickerProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const titleId = useId();
  const triggerId = id ?? titleId;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const initialMonths = defaultViewMonths(today, max);
  const [leftMonth, setLeftMonth] = useState(initialMonths.left);
  const [rightMonth, setRightMonth] = useState(initialMonths.right);

  const minMonth = getYearMonth(min);
  const maxMonth = getYearMonth(max);
  const pickingEnd = draftStart != null && draftEnd == null;
  const cursor = pickingEnd ? hover : draftEnd;
  const committed = draftStart != null && draftEnd != null;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function syncView(nextFrom: string, nextTo: string) {
    const startMonth = getYearMonth(nextFrom);
    const endMonth = getYearMonth(nextTo);
    setLeftMonth(startMonth);
    setRightMonth(
      compareYearMonths(endMonth, startMonth) > 0
        ? endMonth
        : addYearMonths(startMonth, 1),
    );
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setHover(null);
    setDraftStart(null);
    setDraftEnd(null);
    const view = defaultViewMonths(today, max);
    setLeftMonth(view.left);
    setRightMonth(view.right);

    const previousActive = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [open]);

  const headerRange = (() => {
    if (!draftStart) {
      return PLACEHOLDER;
    }
    const end = cursor ?? draftStart;
    const ordered = orderRange(draftStart, end);
    return `${formatDisplayDate(ordered.from)} ~ ${formatDisplayDate(ordered.to)}`;
  })();

  function applyPreset(nextFrom: string, nextTo: string) {
    const ordered = orderRange(
      clampIso(nextFrom, min, max),
      clampIso(nextTo, min, max),
    );
    setDraftStart(ordered.from);
    setDraftEnd(ordered.to);
    setHover(null);
    syncView(ordered.from, ordered.to);
  }

  function handleSelect(iso: string) {
    if (iso < min || iso > max) {
      return;
    }
    if (!draftStart || draftEnd) {
      setDraftStart(iso);
      setDraftEnd(null);
      setHover(iso);
      return;
    }
    setDraftStart(orderRange(draftStart, iso).from);
    setDraftEnd(orderRange(draftStart, iso).to);
    setHover(null);
  }

  function confirm() {
    if (!draftStart || !draftEnd) {
      return;
    }
    const ordered = orderRange(draftStart, draftEnd);
    onChange(ordered.from, ordered.to);
    setOpen(false);
  }

  const hasValue = Boolean(from && to);
  const triggerLabel = hasValue
    ? `${formatDisplayDate(from as string)} ~ ${formatDisplayDate(to as string)}`
    : PLACEHOLDER;

  const calendarProps = {
    min,
    max,
    today,
    anchor: draftStart,
    cursor: cursor ?? draftStart,
    committed,
    hover,
    onSelect: handleSelect,
    onHover: setHover,
  };

  return (
    <>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-base shadow-sm transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
      >
        <span
          className={cn(
            "truncate tabular-nums",
            hasValue ? "text-text" : "text-muted",
          )}
        >
          {triggerLabel}
        </span>
        <span className="shrink-0 text-muted">
          <CalendarIcon />
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-6"
              role="presentation"
            >
              <div
                className="absolute inset-0 bg-scrim/55 backdrop-blur-md dark:bg-scrim/70"
                aria-hidden
              />
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-default border-0 bg-transparent"
                aria-label="Close date range picker"
                onClick={() => setOpen(false)}
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="relative z-10 flex max-h-[min(100dvh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl focus:outline-none sm:max-w-[44rem] sm:rounded-2xl"
                style={{
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, var(--color-border) 70%, transparent), var(--c-modal-shadow)",
                }}
              >
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <p
                    id={titleId}
                    className={cn(
                      "text-sm tabular-nums",
                      draftStart
                        ? "font-semibold text-text"
                        : "font-medium text-muted",
                    )}
                  >
                    {headerRange}
                  </p>
                </div>

                <div
                  className="min-h-0 overflow-y-auto overflow-x-hidden"
                  onPointerLeave={() => setHover(null)}
                >
                  {isDesktop ? (
                    <div className="grid grid-cols-2 divide-x divide-border">
                      <MonthCalendar
                        {...calendarProps}
                        yearMonth={leftMonth}
                        canPrev={compareYearMonths(leftMonth, minMonth) > 0}
                        canNext={
                          compareYearMonths(
                            addYearMonths(leftMonth, 1),
                            rightMonth,
                          ) < 0
                        }
                        onPrev={() => setLeftMonth(addYearMonths(leftMonth, -1))}
                        onNext={() => setLeftMonth(addYearMonths(leftMonth, 1))}
                      />
                      <MonthCalendar
                        {...calendarProps}
                        yearMonth={rightMonth}
                        canPrev={
                          compareYearMonths(
                            addYearMonths(leftMonth, 1),
                            rightMonth,
                          ) < 0
                        }
                        canNext={compareYearMonths(rightMonth, maxMonth) < 0}
                        onPrev={() =>
                          setRightMonth(addYearMonths(rightMonth, -1))
                        }
                        onNext={() =>
                          setRightMonth(addYearMonths(rightMonth, 1))
                        }
                      />
                    </div>
                  ) : (
                    <MonthCalendar
                      {...calendarProps}
                      yearMonth={leftMonth}
                      canPrev={compareYearMonths(leftMonth, minMonth) > 0}
                      canNext={compareYearMonths(leftMonth, maxMonth) < 0}
                      onPrev={() => setLeftMonth(addYearMonths(leftMonth, -1))}
                      onNext={() => setLeftMonth(addYearMonths(leftMonth, 1))}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <button
                      type="button"
                      className="min-h-9 cursor-pointer text-sm font-medium text-primary hover:underline"
                      onClick={() => applyPreset(today, today)}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="min-h-9 cursor-pointer text-sm font-medium text-primary hover:underline"
                      onClick={() => {
                        const yesterday = addLocalDays(today, -1);
                        applyPreset(yesterday, yesterday);
                      }}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      className="min-h-9 cursor-pointer text-sm font-medium text-primary hover:underline"
                      onClick={() => applyPreset(addLocalDays(today, -6), today)}
                    >
                      Last 7 Days
                    </button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-20"
                    disabled={!committed}
                    onClick={confirm}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

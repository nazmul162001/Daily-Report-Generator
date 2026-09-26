import { useEffect, useId, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { copyToClipboard } from "@/lib/clipboard";
import { formatHoursFromMinutes } from "@/lib/duration";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Direction = "minutes-to-hours" | "hours-to-minutes";

type CalculatorState = {
  direction: Direction;
  multiple: boolean;
  draft: string;
  entries: number[];
};

const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  direction: "hours-to-minutes",
  multiple: false,
  draft: "",
  entries: [],
};

function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function sanitizeNumber(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) {
    return cleaned;
  }
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, "")}`;
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "." || !/^\d*\.?\d*$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function roundTotal(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
}

function isDirection(value: unknown): value is Direction {
  return value === "minutes-to-hours" || value === "hours-to-minutes";
}

function loadCalculatorState(): CalculatorState {
  const raw = getStorageItem<unknown>(STORAGE_KEYS.hoursCalculator, null);
  if (!raw || typeof raw !== "object") {
    return DEFAULT_CALCULATOR_STATE;
  }
  const saved = raw as Partial<CalculatorState>;
  const entries = Array.isArray(saved.entries)
    ? saved.entries.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0,
      )
    : [];
  return {
    direction: isDirection(saved.direction) ? saved.direction : DEFAULT_CALCULATOR_STATE.direction,
    multiple: saved.multiple === true,
    draft: typeof saved.draft === "string" ? sanitizeNumber(saved.draft) : "",
    entries: entries.map((value) => Math.round(value * 100) / 100),
  };
}

function saveCalculatorState(state: CalculatorState) {
  setStorageItem(STORAGE_KEYS.hoursCalculator, state);
}

export function HoursCalculatorPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [direction, setDirection] = useState<Direction>("hours-to-minutes");
  const [multiple, setMultiple] = useState(false);
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const fromHours = direction === "hours-to-minutes";
  const unitLabel = fromHours ? "Hours" : "Minutes";
  const unitShort = fromHours ? "hr" : "min";
  const unitWord = fromHours ? "hours" : "minutes";
  const draftValue = parseAmount(draft);
  const sourceTotal = multiple
    ? entries.length > 0
      ? roundTotal(entries)
      : null
    : draftValue;
  const totalMinutes =
    sourceTotal === null
      ? null
      : Math.round((fromHours ? sourceTotal * 60 : sourceTotal) * 100) / 100;
  const hoursLabel = totalMinutes === null ? null : formatHoursFromMinutes(totalMinutes);
  const minutesLabel = totalMinutes === null ? null : formatAmount(totalMinutes);
  const resultLabel = fromHours ? minutesLabel : hoursLabel;
  const resultUnit = fromHours ? "minutes" : "hours";
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadCalculatorState();
    setDirection(saved.direction);
    setMultiple(saved.multiple);
    setDraft(saved.draft);
    setEntries(saved.entries);
    setHydrated(true);
    return () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveCalculatorState({ direction, multiple, draft, entries });
  }, [hydrated, direction, multiple, draft, entries]);

  function selectDirection(next: Direction) {
    setDirection(next);
    setDraft("");
    setEntries([]);
    setError(null);
    setCopied(false);
  }

  function updateDraft(next: string) {
    setDraft(sanitizeNumber(next));
    setError(null);
    setCopied(false);
  }

  function addEntry(value: number) {
    setEntries((current) => [...current, value]);
    setCopied(false);
    setError(null);
  }

  function commitDraft() {
    if (!draft.trim()) {
      return;
    }
    const value = parseAmount(draft);
    if (value === null) {
      setError(fromHours ? "Enter a number of hours, like 0.75." : "Enter a number of minutes, like 65.");
      return;
    }
    addEntry(value);
    setDraft("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleCopy() {
    if (!resultLabel) {
      return;
    }
    const result = await copyToClipboard(resultLabel);
    if (!result.success) {
      return;
    }
    setCopied(true);
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl">
      <Card className="p-4 sm:p-8">
        <div className="mb-5 sm:mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Live conversion
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text sm:text-xl">
            {fromHours ? "Hours to minutes" : "Minutes to hours"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {multiple
              ? "Type a value and press Enter to add it."
              : "Type one value to convert."}
          </p>
        </div>

        <Input
          ref={inputRef}
          id={inputId}
          label={unitLabel}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint={multiple ? "next" : "done"}
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && multiple) {
              event.preventDefault();
              commitDraft();
            }
          }}
          placeholder={fromHours ? "e.g. 0.75" : "e.g. 65"}
          error={error ?? undefined}
          className="font-mono tabular-nums"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div
            className="grid grid-cols-2 rounded-xl border border-border bg-background p-1"
            role="group"
            aria-label="Conversion direction"
          >
            <DirectionButton
              pressed={fromHours}
              onClick={() => selectDirection("hours-to-minutes")}
            >
              Hours → Min
            </DirectionButton>
            <DirectionButton
              pressed={!fromHours}
              onClick={() => selectDirection("minutes-to-hours")}
            >
              Min → Hours
            </DirectionButton>
          </div>

          <label
            className={cn(
              "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
              multiple
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background text-muted hover:border-primary/40 hover:text-text",
            )}
          >
            <input
              type="checkbox"
              checked={multiple}
              onChange={(event) => {
                setMultiple(event.target.checked);
                setError(null);
                setCopied(false);
                window.requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                multiple
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-transparent",
              )}
              aria-hidden
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Add multiple entries
          </label>
        </div>

        {multiple ? (
          <div className="mt-3">
            {entries.length === 0 ? (
              <p className="text-xs text-muted">
                {fromHours
                  ? "Press Enter after each number of hours."
                  : "Press Enter after each number of minutes."}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2" aria-label="Added values">
                {entries.map((value, index) => (
                  <li key={`${value}-${index}`}>
                    <span className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-background pl-3 pr-1 text-sm font-medium text-text">
                      <span className="tabular-nums">
                        {formatAmount(value)} {unitShort}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${formatAmount(value)} ${unitWord}`}
                        onClick={() => {
                          setEntries((current) => current.filter((_, itemIndex) => itemIndex !== index));
                          setCopied(false);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-primary/10 hover:text-text"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-5 rounded-2xl border bg-background px-4 py-5 text-center sm:mt-6 sm:px-8 sm:py-8",
            copied ? "copy-preview-flash border-success/40" : "border-border",
          )}
          aria-live="polite"
        >
          {totalMinutes !== null && resultLabel && hoursLabel && minutesLabel ? (
            <>
              <p className="text-3xl font-bold tracking-tight text-text sm:text-5xl">
                {resultLabel}
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted">
                {resultUnit}
              </p>
              <p className="mt-3 text-sm text-text sm:text-base">
                {minutesLabel} minutes ({hoursLabel} hours)
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight text-muted/40 sm:text-5xl">—</p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted">
                {resultUnit}
              </p>
              <p className="mt-4 text-sm text-muted">
                {multiple
                  ? "Add a value with Enter to calculate."
                  : fromHours
                    ? "Enter hours above to calculate."
                    : "Enter minutes above to calculate."}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!resultLabel}
          aria-label={copied ? "Copied to clipboard" : "Copy result"}
          className={cn(
            "relative mt-5 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-visible rounded-xl border px-4 text-sm font-semibold shadow-sm transition-all duration-200",
            copied
              ? "border-success/35 bg-success/15 text-success"
              : "border-primary bg-primary text-on-primary hover:bg-primary-hover active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <span key={copied ? "check" : "copy"} className="copy-icon-swap">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
          {copied ? "Copied" : "Copy result"}
          {copied ? (
            <>
              <span className="copy-burst" aria-hidden />
              <span className="copy-spark copy-spark-1" aria-hidden />
              <span className="copy-spark copy-spark-2" aria-hidden />
              <span className="copy-spark copy-spark-3" aria-hidden />
              <span className="copy-spark copy-spark-4" aria-hidden />
            </>
          ) : null}
        </button>
      </Card>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
      <rect x="9" y="9" width="11" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.2 4.2L19 7.5" />
    </svg>
  );
}

function DirectionButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors",
        pressed ? "bg-primary text-on-primary" : "text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

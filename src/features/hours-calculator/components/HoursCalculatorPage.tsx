import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { copyToClipboard } from "@/lib/clipboard";
import {
  formatDurationLabel,
  formatHoursFromMinutes,
  parseMinutes,
} from "@/lib/duration";

function sanitizeMinutesInput(raw: string): string {
  return raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

const PRESETS = ["30", "60", "90", "120", "294"] as const;

export function HoursCalculatorPage() {
  const inputId = useId();
  const [minutes, setMinutes] = useState("");
  const [copied, setCopied] = useState(false);

  const parsed = parseMinutes(minutes);
  const hasInvalid = minutes.trim().length > 0 && parsed === null;
  const hoursLabel = parsed === null ? null : formatHoursFromMinutes(parsed);
  const fullLabel =
    parsed === null ? null : formatDurationLabel(String(parsed), false);

  async function handleCopy() {
    if (!fullLabel) {
      return;
    }
    const result = await copyToClipboard(fullLabel);
    if (result.success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl">
      <Card className="p-4 sm:p-8">
        <div className="mb-5 sm:mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Live conversion
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text sm:text-xl">
            Minutes to hours
          </h2>
          <p className="mt-1 text-sm text-muted">
            Same rounding as Detailed Report: hours = minutes ÷ 60, up to 2
            decimals.
          </p>
        </div>

        <Input
          id={inputId}
          label="Minutes"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={minutes}
          onChange={(event) => {
            setMinutes(sanitizeMinutesInput(event.target.value));
            setCopied(false);
          }}
          placeholder="e.g. 65"
          hint="Type a number to see hours instantly."
          error={
            hasInvalid
              ? "Enter a valid number of minutes (0 or more)."
              : undefined
          }
          className="font-mono tabular-nums"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setMinutes(preset);
                setCopied(false);
              }}
              className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-full border border-border bg-background px-3 text-sm text-muted transition-colors hover:border-primary/40 hover:text-text sm:min-h-9 sm:flex-none"
            >
              {preset} min
            </button>
          ))}
        </div>

        <div
          className="mt-5 rounded-2xl border border-border bg-background px-4 py-5 text-center sm:mt-6 sm:px-8 sm:py-8"
          aria-live="polite"
        >
          {hoursLabel && fullLabel ? (
            <>
              <p className="text-3xl font-bold tracking-tight text-text sm:text-5xl">
                {hoursLabel}
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted">
                hours
              </p>
              <p className="mt-3 break-words text-sm text-text sm:mt-4 sm:text-base">{fullLabel}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight text-muted/40 sm:text-5xl">
                —
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted">
                hours
              </p>
              <p className="mt-4 text-sm text-muted">
                Enter minutes above to calculate.
              </p>
            </>
          )}
        </div>

        <Button
          className="mt-5"
          fullWidth
          disabled={!fullLabel}
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy result"}
        </Button>
      </Card>
    </div>
  );
}

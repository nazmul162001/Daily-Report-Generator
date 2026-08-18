import { Card } from "@/components/ui/Card";
import { formatElapsedClock } from "@/features/time-tracking/timer";
import { formatMinutesShort } from "@/lib/duration";
import { kindLabel } from "./categories";
import { getTimedDurationMs } from "./timer";
import { liveMinutesForKind } from "./totals";
import type { WorkLogDay, WorkLogKind } from "./types";

const SUMMARY_KINDS: WorkLogKind[] = [
  "revision",
  "feedback",
  "question",
  "meeting",
  "review",
  "investigation",
  "custom",
];

export function WorkLogTodayCard({
  day,
  now,
}: {
  day: WorkLogDay;
  now: number;
}) {
  const rows = SUMMARY_KINDS.map((kind) => ({
    kind,
    minutes: liveMinutesForKind(day, kind, now, { includeTrackingFallback: false }),
    count:
      kind === "review"
        ? day.reviews.length
        : day.timed.filter((entry) => entry.kind === kind).length,
  })).filter((row) => row.minutes > 0 || row.count > 0);

  const running = day.timed.find((entry) => entry.status === "running");

  if (rows.length === 0 && !running) {
    return null;
  }

  return (
    <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Work log
        </p>
        <h3 className="mt-1 text-base font-semibold text-text">
          Logged from Detailed Report
        </h3>
      {running ? (
        <p className="mt-1 text-sm text-muted">
          Running: {running.label}
          {running.taskNo ? ` · ${running.taskNo}` : ""} ·{" "}
          {formatElapsedClock(getTimedDurationMs(running, now))}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.kind} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-text">{kindLabel(row.kind)}</span>
            <span className="tabular-nums text-muted">
              {formatMinutesShort(row.minutes)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

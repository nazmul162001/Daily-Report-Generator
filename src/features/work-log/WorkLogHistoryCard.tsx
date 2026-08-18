import { Card } from "@/components/ui/Card";
import { formatMinutesShort } from "@/lib/duration";
import { kindLabel } from "./categories";
import { formatKindDetails } from "./format";
import { liveMinutesForKind } from "./totals";
import type { WorkLogDay, WorkLogKind } from "./types";

const HISTORY_KINDS: WorkLogKind[] = [
  "revision",
  "feedback",
  "question",
  "meeting",
  "review",
  "investigation",
  "custom",
];

export function WorkLogHistoryCard({
  day,
  now,
}: {
  day: WorkLogDay;
  now: number;
}) {
  const groups = HISTORY_KINDS.map((kind) => ({
    kind,
    minutes: liveMinutesForKind(day, kind, now, { includeTrackingFallback: false }),
    details: formatKindDetails(day, kind, now),
  })).filter((group) => group.minutes > 0 || group.details.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        Work log
      </p>
      <ul className="mt-2 space-y-3">
        {groups.map((group) => (
          <li key={group.kind}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-text">{kindLabel(group.kind)}</span>
              <span className="tabular-nums text-muted">
                {formatMinutesShort(group.minutes)}
              </span>
            </div>
            {group.details.length > 0 ? (
              <ul className="mt-1 space-y-0.5 pl-3 text-sm text-muted">
                {group.details.map((detail, index) => (
                  <li key={`${group.kind}-${index}`}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

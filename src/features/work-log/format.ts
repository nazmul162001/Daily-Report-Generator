import { formatDurationLabel, formatMinutesShort } from "@/lib/duration";
import { durationMsToMinutes } from "@/features/time-tracking/timer";
import { kindLabel } from "./categories";
import { getTimedDurationMs } from "./timer";
import type { WorkLogDay, WorkLogKind } from "./types";
import { entriesForKind } from "./totals";

export function formatKindDetails(
  day: WorkLogDay,
  kind: WorkLogKind,
  now = Date.now(),
): string[] {
  const { timed, reviews } = entriesForKind(day, kind);
  const lines: string[] = [];

  for (const entry of timed) {
    const minutes = durationMsToMinutes(getTimedDurationMs(entry, now));
    if (minutes <= 0 && entry.status !== "running") {
      continue;
    }
    const title = entry.taskNo
      ? `${entry.label} / ${entry.taskNo}`
      : entry.label;
    if (minutes <= 0) {
      lines.push(`${title} · in progress`);
      continue;
    }
    lines.push(`${title} · ${formatMinutesShort(minutes)}`);
  }

  for (const entry of reviews) {
    if (entry.minutes <= 0) {
      continue;
    }
    lines.push(`${entry.projectName} self-check · ${formatMinutesShort(entry.minutes)}`);
  }

  return lines;
}

export function formatKindHeading(kind: WorkLogKind): string {
  return kindLabel(kind);
}

export function formatDurationLabelForMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  return formatDurationLabel(String(rounded), false);
}

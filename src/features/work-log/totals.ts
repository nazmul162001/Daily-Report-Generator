import { durationMsToMinutes } from "@/features/time-tracking/timer";
import { getTodayTrackedMinutes } from "@/features/time-tracking/storage";
import type { WorkBreakdownItem } from "@/types/common";
import { kindFromCategory } from "./categories";
import { getTimedDurationMs } from "./timer";
import type { ReviewLogEntry, TimedLogEntry, WorkLogDay, WorkLogKind } from "./types";

export function timedMinutesForKind(
  day: WorkLogDay,
  kind: Exclude<WorkLogKind, "review">,
  now = Date.now(),
): number {
  return day.timed
    .filter((entry) => entry.kind === kind)
    .reduce((sum, entry) => sum + durationMsToMinutes(getTimedDurationMs(entry, now)), 0);
}

export function reviewMinutes(day: WorkLogDay): number {
  return day.reviews.reduce((sum, entry) => sum + Math.max(0, entry.minutes), 0);
}

export function liveMinutesForKind(
  day: WorkLogDay,
  kind: WorkLogKind,
  now = Date.now(),
  options?: { includeTrackingFallback?: boolean },
): number {
  if (kind === "review") {
    return reviewMinutes(day);
  }
  const logged = timedMinutesForKind(day, kind, now);
  if (
    kind === "revision" &&
    logged <= 0 &&
    options?.includeTrackingFallback !== false
  ) {
    return getTodayTrackedMinutes({ includeRunning: true, now });
  }
  return logged;
}

export function roundLiveMinutes(minutes: number): number {
  return Math.round(minutes * 100) / 100;
}

export function minutesToInput(minutes: number): string {
  const rounded = roundLiveMinutes(minutes);
  if (rounded <= 0) {
    return "";
  }
  return String(rounded);
}

export function displayMinutesForItem(
  item: WorkBreakdownItem,
  day: WorkLogDay,
  now = Date.now(),
): string {
  if (item.isNA || item.minutesLocked) {
    return item.minutes;
  }
  const live = roundLiveMinutes(
    liveMinutesForKind(day, kindFromCategory(item.category), now),
  );
  if (live <= 0) {
    return item.minutes;
  }
  return minutesToInput(live);
}

export function uniqueProjectNames(day: WorkLogDay): string[] {
  return projectNamesForKind(day, "review");
}

export function projectNamesForKind(day: WorkLogDay, kind: WorkLogKind): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  function add(name: string) {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(trimmed);
  }
  for (const name of day.boardProjects?.[kind] ?? []) {
    add(name);
  }
  if (kind === "review") {
    for (const review of day.reviews) {
      add(review.projectName);
    }
    return names;
  }
  for (const entry of day.timed) {
    if (entry.kind === kind) {
      add(entry.label);
    }
  }
  return names;
}

export function groupTasksByProject(
  day: WorkLogDay,
  kind: Exclude<WorkLogKind, "review">,
): { name: string; tasks: TimedLogEntry[] }[] {
  const tasks = day.timed.filter((entry) => entry.kind === kind);
  return projectNamesForKind(day, kind).map((name) => ({
    name,
    tasks: tasks.filter(
      (entry) => entry.label.trim().toLowerCase() === name.toLowerCase(),
    ),
  }));
}

export function dayLoggedMinutes(day: WorkLogDay, now = Date.now()): number {
  const timed = day.timed.reduce(
    (sum, entry) => sum + durationMsToMinutes(getTimedDurationMs(entry, now)),
    0,
  );
  return timed + reviewMinutes(day);
}

export function datesWithWorkLog(
  days: Record<string, WorkLogDay>,
  fromIso: string,
  toIso: string,
): string[] {
  return Object.entries(days)
    .filter(
      ([date, day]) =>
        date >= fromIso &&
        date <= toIso &&
        (day.timed.length > 0 || day.reviews.length > 0),
    )
    .map(([date]) => date);
}

export function applyLiveMinutes(
  items: WorkBreakdownItem[],
  day: WorkLogDay,
  now = Date.now(),
): WorkBreakdownItem[] {
  let changed = false;
  const next = items.map((item) => {
    if (item.isNA || item.minutesLocked) {
      return item;
    }
    const kind = kindFromCategory(item.category);
    const live = roundLiveMinutes(liveMinutesForKind(day, kind, now));
    if (live <= 0) {
      return item;
    }
    const asText = minutesToInput(live);
    if (item.minutes === asText && item.isNA === false) {
      return item;
    }
    changed = true;
    return { ...item, minutes: asText, isNA: false };
  });
  return changed ? next : items;
}

export function entriesForKind(
  day: WorkLogDay,
  kind: WorkLogKind,
): { timed: TimedLogEntry[]; reviews: ReviewLogEntry[] } {
  if (kind === "review") {
    return { timed: [], reviews: day.reviews };
  }
  return {
    timed: day.timed.filter((entry) => entry.kind === kind),
    reviews: [],
  };
}

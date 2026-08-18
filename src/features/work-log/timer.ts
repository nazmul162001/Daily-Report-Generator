import { minutesToDurationMs } from "@/features/time-tracking/timer";
import type { TimedLogEntry, TimedStatus } from "./types";

export function getTimedDurationMs(
  entry: TimedLogEntry,
  now = Date.now(),
): number {
  const base = Math.max(0, entry.elapsedMs);
  if (entry.status === "running" && typeof entry.startedAt === "number") {
    return base + Math.max(0, now - entry.startedAt);
  }
  return base;
}

export function pauseEntry(entry: TimedLogEntry, now = Date.now()): TimedLogEntry {
  if (entry.status !== "running" || typeof entry.startedAt !== "number") {
    return entry.status === "running"
      ? { ...entry, status: "paused", startedAt: null }
      : entry;
  }
  return {
    ...entry,
    status: "paused",
    elapsedMs: getTimedDurationMs(entry, now),
    startedAt: null,
  };
}

export function resumeEntry(entry: TimedLogEntry, now = Date.now()): TimedLogEntry {
  if (entry.status === "done") {
    return entry;
  }
  return {
    ...entry,
    status: "running",
    startedAt: now,
  };
}

export function completeEntry(entry: TimedLogEntry, now = Date.now()): TimedLogEntry {
  const paused = pauseEntry(entry, now);
  return { ...paused, status: "done", startedAt: null };
}

export function startFreshEntry(
  entry: TimedLogEntry,
  now = Date.now(),
): TimedLogEntry {
  return {
    ...entry,
    status: "running",
    startedAt: now,
  };
}

export function setElapsedMinutes(
  entry: TimedLogEntry,
  minutes: number,
): TimedLogEntry {
  const elapsedMs = minutesToDurationMs(Math.max(0, minutes));
  if (entry.status === "running") {
    return {
      ...entry,
      status: "paused",
      elapsedMs,
      startedAt: null,
    };
  }
  if (entry.status === "idle") {
    return {
      ...entry,
      status: elapsedMs > 0 ? "paused" : "idle",
      elapsedMs,
      startedAt: null,
    };
  }
  return {
    ...entry,
    elapsedMs,
    startedAt: null,
  };
}

export function isActiveStatus(status: TimedStatus): boolean {
  return status === "running" || status === "paused";
}

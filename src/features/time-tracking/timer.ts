import type { TrackingTask } from "./types";

const MS_PER_MINUTE = 60_000;

/** Elapsed ms for a task. Timestamps (or an edit override) are the source of truth. */
export function getTaskDurationMs(task: TrackingTask, now = Date.now()): number {
  if (task.editedMinutes != null && Number.isFinite(task.editedMinutes)) {
    return Math.max(0, task.editedMinutes) * MS_PER_MINUTE;
  }

  if (task.status === "running" && typeof task.startedAt === "number") {
    return Math.max(0, now - task.startedAt);
  }

  if (task.status === "completed") {
    if (typeof task.durationMs === "number" && task.durationMs > 0) {
      return task.durationMs;
    }
    if (
      typeof task.startedAt === "number" &&
      typeof task.completedAt === "number"
    ) {
      return Math.max(0, task.completedAt - task.startedAt);
    }
  }

  return 0;
}

export function durationMsToMinutes(ms: number): number {
  return Math.max(0, ms) / MS_PER_MINUTE;
}

export function minutesToDurationMs(minutes: number): number {
  return Math.max(0, minutes) * MS_PER_MINUTE;
}

/** Clock display `HH:MM:SS` from elapsed milliseconds. */
export function formatElapsedClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function completeTaskFromTimestamps(
  task: TrackingTask,
  completedAt: number,
): TrackingTask {
  const startedAt =
    typeof task.startedAt === "number" ? task.startedAt : completedAt;
  const durationMs = Math.max(0, completedAt - startedAt);
  return {
    ...task,
    status: "completed",
    startedAt,
    completedAt,
    durationMs,
    editedMinutes: null,
  };
}

export function startTaskRun(task: TrackingTask, startedAt: number): TrackingTask {
  return {
    ...task,
    status: "running",
    startedAt,
    completedAt: null,
    durationMs: 0,
    editedMinutes: null,
  };
}

export function applyEditedMinutes(
  task: TrackingTask,
  minutes: number,
): TrackingTask {
  const safeMinutes = Math.max(0, minutes);
  return {
    ...task,
    status: "completed",
    editedMinutes: safeMinutes,
    durationMs: minutesToDurationMs(safeMinutes),
  };
}

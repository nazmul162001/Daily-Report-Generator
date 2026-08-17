import { getTaskDurationMs, durationMsToMinutes } from "./timer";
import type { TrackingProject, TrackingTask } from "./types";

export function sumTaskDurationMs(
  tasks: TrackingTask[],
  now = Date.now(),
  includeRunning = true,
): number {
  return tasks.reduce((total, task) => {
    if (!includeRunning && task.status === "running") {
      return total;
    }
    return total + getTaskDurationMs(task, now);
  }, 0);
}

export function getProjectDurationMs(
  project: TrackingProject,
  now = Date.now(),
  includeRunning = true,
): number {
  return sumTaskDurationMs(project.tasks, now, includeRunning);
}

export function getProjectsDurationMs(
  projects: TrackingProject[],
  now = Date.now(),
  includeRunning = true,
): number {
  return projects.reduce(
    (total, project) => total + getProjectDurationMs(project, now, includeRunning),
    0,
  );
}

export function getProjectsDurationMinutes(
  projects: TrackingProject[],
  now = Date.now(),
  includeRunning = true,
): number {
  return durationMsToMinutes(
    getProjectsDurationMs(projects, now, includeRunning),
  );
}

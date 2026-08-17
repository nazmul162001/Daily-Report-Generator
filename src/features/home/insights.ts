import {
  addLocalDays,
  eachLocalDay,
  getLocalRetentionCutoffIso,
  getTodayIsoDate,
  startOfLocalMonth,
} from "@/lib/date";
import { getDay, loadTimeTrackingStore } from "@/features/time-tracking/storage";
import { getProjectsDurationMinutes } from "@/features/time-tracking/totals";
import { TIME_TRACKING_RETENTION_DAYS } from "@/features/time-tracking/types";

export type InsightRange = "7d" | "30d" | "month" | "all" | "custom";

export interface InsightDay {
  date: string;
  hours: number;
  minutes: number;
  projects: number;
  completedTasks: number;
  openTasks: number;
  isToday: boolean;
}

export interface RatioSlice {
  label: string;
  value: number;
  color: string;
}

export interface HomeInsightsData {
  from: string;
  to: string;
  days: InsightDay[];
  hours: number;
  minutes: number;
  completedTasks: number;
  openTasks: number;
  projects: number;
  taskRatio: { completed: number; open: number };
  projectRatio: { finished: number; inProgress: number };
  hasActivity: boolean;
}

export function resolveInsightRange(
  kind: InsightRange,
  today: string,
  custom: { from: string; to: string } | null,
): { from: string; to: string } {
  const cutoff = getLocalRetentionCutoffIso(TIME_TRACKING_RETENTION_DAYS, today);
  if (kind === "7d") {
    return { from: addLocalDays(today, -6), to: today };
  }
  if (kind === "30d") {
    return { from: cutoff, to: today };
  }
  if (kind === "month") {
    const start = startOfLocalMonth(today);
    return { from: start < cutoff ? cutoff : start, to: today };
  }
  if (kind === "custom" && custom) {
    const from = custom.from < custom.to ? custom.from : custom.to;
    const to = custom.from < custom.to ? custom.to : custom.from;
    return {
      from: from < cutoff ? cutoff : from,
      to: to > today ? today : to,
    };
  }
  return { from: cutoff, to: today };
}

export function loadHomeInsights(
  fromIso: string,
  toIso: string,
  today = getTodayIsoDate(),
): HomeInsightsData {
  const store = loadTimeTrackingStore(today);
  const now = Date.now();

  const uniqueProjects = new Set<string>();
  let minutes = 0;
  let completedTasks = 0;
  let openTasks = 0;
  let finishedProjects = 0;
  let inProgressProjects = 0;

  const days = eachLocalDay(fromIso, toIso).map((date) => {
    const projects = getDay(store, date).projects;
    const dayMinutes = getProjectsDurationMinutes(projects, now, date === today);
    let dayCompleted = 0;
    let dayOpen = 0;
    let dayProjects = 0;

    for (const project of projects) {
      const projectCompleted = project.tasks.filter(
        (task) => task.status === "completed",
      ).length;
      const projectOpen = project.tasks.filter(
        (task) => task.status !== "completed",
      ).length;
      dayCompleted += projectCompleted;
      dayOpen += projectOpen;
      if (project.tasks.length > 0) {
        dayProjects += 1;
        uniqueProjects.add(project.name || project.id);
        if (projectOpen === 0 && projectCompleted > 0) {
          finishedProjects += 1;
        } else if (projectOpen > 0) {
          inProgressProjects += 1;
        }
      }
    }

    minutes += dayMinutes;
    completedTasks += dayCompleted;
    openTasks += dayOpen;

    return {
      date,
      minutes: dayMinutes,
      hours: Math.round((dayMinutes / 60) * 100) / 100,
      projects: dayProjects,
      completedTasks: dayCompleted,
      openTasks: dayOpen,
      isToday: date === today,
    };
  });

  return {
    from: fromIso,
    to: toIso,
    days,
    hours: Math.round((minutes / 60) * 100) / 100,
    minutes,
    completedTasks,
    openTasks,
    projects: uniqueProjects.size,
    taskRatio: { completed: completedTasks, open: openTasks },
    projectRatio: {
      finished: finishedProjects,
      inProgress: inProgressProjects,
    },
    hasActivity: minutes > 0 || completedTasks > 0 || openTasks > 0,
  };
}

import {
  addLocalDays,
  eachLocalDay,
  formatShortMonthDay,
  getLocalRetentionCutoffIso,
  getTodayIsoDate,
} from "@/lib/date";
import { loadHomeInsights } from "@/features/home/insights";
import { kindLabel } from "@/features/work-log/categories";
import {
  getWorkLogDay,
  loadWorkLogStore,
} from "@/features/work-log/storage";
import { liveMinutesForKind } from "@/features/work-log/totals";
import type { WorkLogKind } from "@/features/work-log/types";
import { getDay, loadTimeTrackingStore } from "@/features/time-tracking/storage";
import { getProjectDurationMs } from "@/features/time-tracking/totals";
import { durationMsToMinutes } from "@/features/time-tracking/timer";
import { TIME_TRACKING_RETENTION_DAYS } from "@/features/time-tracking/types";
import { syncWorkLogToTracking } from "@/features/work-log/syncToTracking";
import type {
  BriefCategorySlice,
  BriefPeriod,
  BriefProjectSlice,
  BriefSignal,
  WeeklyBriefData,
} from "./types";

const CATEGORY_ORDER: WorkLogKind[] = [
  "revision",
  "feedback",
  "question",
  "meeting",
  "review",
  "investigation",
  "custom",
];

function mondayOfWeek(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  const weekday = date.getDay(); // 0 Sun … 6 Sat
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addLocalDays(isoDate, delta);
}

export function resolveBriefPeriod(
  period: BriefPeriod,
  today = getTodayIsoDate(),
): { from: string; to: string; label: string } {
  const cutoff = getLocalRetentionCutoffIso(TIME_TRACKING_RETENTION_DAYS, today);

  if (period === "this-week") {
    const from = mondayOfWeek(today);
    return {
      from: from < cutoff ? cutoff : from,
      to: today,
      label: "This week",
    };
  }

  if (period === "last-week") {
    const thisMonday = mondayOfWeek(today);
    const lastMonday = addLocalDays(thisMonday, -7);
    const lastSunday = addLocalDays(thisMonday, -1);
    return {
      from: lastMonday < cutoff ? cutoff : lastMonday,
      to: lastSunday > today ? today : lastSunday,
      label: "Last week",
    };
  }

  if (period === "14d") {
    return {
      from: addLocalDays(today, -13) < cutoff ? cutoff : addLocalDays(today, -13),
      to: today,
      label: "Last 14 days",
    };
  }

  return {
    from: addLocalDays(today, -6) < cutoff ? cutoff : addLocalDays(today, -6),
    to: today,
    label: "Last 7 days",
  };
}

function clampPercent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 1000) / 10;
}

function buildSignals(input: {
  consistencyPercent: number;
  completionRate: number;
  openTasks: number;
  categories: BriefCategorySlice[];
  peakDay: { date: string; minutes: number } | null;
  activeDays: number;
  hasActivity: boolean;
}): BriefSignal[] {
  const signals: BriefSignal[] = [];

  if (!input.hasActivity) {
    signals.push({
      id: "empty",
      label: "No tracked work yet",
      detail:
        "Log time on Detailed Report or Activity, then reopen this brief.",
      tone: "attention",
    });
    return signals;
  }

  if (input.consistencyPercent >= 80) {
    signals.push({
      id: "consistency-high",
      label: "Strong consistency",
      detail: `Active on ${input.consistencyPercent}% of days in this period.`,
      tone: "positive",
    });
  } else if (input.consistencyPercent < 50 && input.activeDays > 0) {
    signals.push({
      id: "consistency-low",
      label: "Sparse activity",
      detail: `Only ${input.consistencyPercent}% of days had tracked work — worth a capacity check.`,
      tone: "attention",
    });
  }

  if (input.completionRate >= 75) {
    signals.push({
      id: "completion-high",
      label: "High task completion",
      detail: `${input.completionRate}% of tasks marked complete.`,
      tone: "positive",
    });
  } else if (input.openTasks > 0 && input.completionRate < 40) {
    signals.push({
      id: "completion-low",
      label: "Open work in flight",
      detail: `${input.openTasks} open task${input.openTasks === 1 ? "" : "s"} still unfinished.`,
      tone: "attention",
    });
  }

  const top = input.categories[0];
  if (top && top.percent >= 45) {
    signals.push({
      id: "focus",
      label: `Heavy focus: ${top.label}`,
      detail: `${top.percent}% of logged category time — primary investment this period.`,
      tone: "neutral",
    });
  }

  if (input.peakDay && input.peakDay.minutes > 0) {
    signals.push({
      id: "peak",
      label: "Peak delivery day",
      detail: `${formatShortMonthDay(input.peakDay.date)} · ${Math.round(input.peakDay.minutes)} min`,
      tone: "neutral",
    });
  }

  return signals.slice(0, 4);
}

export function loadWeeklyBrief(
  period: BriefPeriod,
  today = getTodayIsoDate(),
  now = Date.now(),
): WeeklyBriefData {
  const { from, to, label } = resolveBriefPeriod(period, today);
  const insights = loadHomeInsights(from, to, today);

  const workLog = loadWorkLogStore(today, now);
  syncWorkLogToTracking(workLog, now);
  const tracking = loadTimeTrackingStore(today, now);

  const kindMinutes = new Map<WorkLogKind, number>();
  for (const date of eachLocalDay(from, to)) {
    const day = getWorkLogDay(workLog, date);
    for (const kind of CATEGORY_ORDER) {
      const mins = liveMinutesForKind(day, kind, now);
      if (mins <= 0) {
        continue;
      }
      kindMinutes.set(kind, (kindMinutes.get(kind) ?? 0) + mins);
    }
  }

  const categoryTotal = [...kindMinutes.values()].reduce((a, b) => a + b, 0);
  const categories: BriefCategorySlice[] = CATEGORY_ORDER.map((kind) => {
    const minutes = Math.round((kindMinutes.get(kind) ?? 0) * 100) / 100;
    return {
      kind,
      label: kindLabel(kind),
      minutes,
      percent: clampPercent(minutes, categoryTotal),
    };
  })
    .filter((slice) => slice.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const projectAgg = new Map<
    string,
    { name: string; minutes: number; completed: number; open: number }
  >();

  for (const date of eachLocalDay(from, to)) {
    const projects = getDay(tracking, date).projects;
    for (const project of projects) {
      if (project.tasks.length === 0) {
        continue;
      }
      const name = project.name.trim() || "Untitled project";
      const key = name.toLowerCase();
      const existing = projectAgg.get(key) ?? {
        name,
        minutes: 0,
        completed: 0,
        open: 0,
      };
      existing.minutes += durationMsToMinutes(
        getProjectDurationMs(project, now, date === today),
      );
      existing.completed += project.tasks.filter(
        (task) => task.status === "completed",
      ).length;
      existing.open += project.tasks.filter(
        (task) => task.status !== "completed",
      ).length;
      projectAgg.set(key, existing);
    }
  }

  const projectMinutesTotal = [...projectAgg.values()].reduce(
    (sum, p) => sum + p.minutes,
    0,
  );
  const topProjects: BriefProjectSlice[] = [...projectAgg.values()]
    .filter((p) => p.minutes > 0 || p.completed > 0 || p.open > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map((p) => ({
      name: p.name,
      minutes: Math.round(p.minutes * 100) / 100,
      completedTasks: p.completed,
      openTasks: p.open,
      percent: clampPercent(p.minutes, projectMinutesTotal),
    }));

  let peakDay: WeeklyBriefData["peakDay"] = null;
  let quietDay: WeeklyBriefData["quietDay"] = null;
  for (const day of insights.days) {
    if (!peakDay || day.minutes > peakDay.minutes) {
      peakDay = { date: day.date, minutes: day.minutes };
    }
    if (day.minutes > 0 && (!quietDay || day.minutes < quietDay.minutes)) {
      quietDay = { date: day.date, minutes: day.minutes };
    }
  }
  if (peakDay && peakDay.minutes <= 0) {
    peakDay = null;
  }

  const activeDays = insights.days.filter((d) => d.minutes > 0).length;
  const totalDays = insights.days.length;
  const consistencyPercent = clampPercent(activeDays, totalDays);
  const taskTotal = insights.completedTasks + insights.openTasks;
  const completionRate = clampPercent(insights.completedTasks, taskTotal);
  const avgHoursPerActiveDay =
    activeDays > 0
      ? Math.round((insights.hours / activeDays) * 100) / 100
      : 0;
  const avgHoursPerDay =
    totalDays > 0
      ? Math.round((insights.hours / totalDays) * 100) / 100
      : 0;

  const days = insights.days.map((day) => ({
    date: day.date,
    minutes: day.minutes,
    hours: day.hours,
    projects: day.projects,
    completedTasks: day.completedTasks,
    openTasks: day.openTasks,
    isToday: day.isToday,
    isPeak: Boolean(peakDay && peakDay.date === day.date && peakDay.minutes > 0),
  }));

  const signals = buildSignals({
    consistencyPercent,
    completionRate,
    openTasks: insights.openTasks,
    categories,
    peakDay,
    activeDays,
    hasActivity: insights.hasActivity,
  });

  return {
    from,
    to,
    periodLabel: label,
    hours: insights.hours,
    minutes: insights.minutes,
    avgHoursPerActiveDay,
    avgHoursPerDay,
    activeDays,
    totalDays,
    consistencyPercent,
    completedTasks: insights.completedTasks,
    openTasks: insights.openTasks,
    completionRate,
    projects: insights.projects,
    finishedProjects: insights.projectRatio.finished,
    inProgressProjects: insights.projectRatio.inProgress,
    categories,
    topProjects,
    days,
    peakDay,
    quietDay:
      quietDay && peakDay && quietDay.date !== peakDay.date ? quietDay : null,
    signals,
    hasActivity: insights.hasActivity,
  };
}

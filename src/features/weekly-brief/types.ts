import type { WorkLogKind } from "@/features/work-log/types";

export type BriefPeriod = "this-week" | "last-week" | "7d" | "14d";

export interface BriefCategorySlice {
  kind: WorkLogKind;
  label: string;
  minutes: number;
  percent: number;
}

export interface BriefProjectSlice {
  name: string;
  minutes: number;
  completedTasks: number;
  openTasks: number;
  percent: number;
}

export interface BriefDayRow {
  date: string;
  minutes: number;
  hours: number;
  projects: number;
  completedTasks: number;
  openTasks: number;
  isToday: boolean;
  isPeak: boolean;
}

export interface BriefSignal {
  id: string;
  label: string;
  detail: string;
  tone: "neutral" | "positive" | "attention";
}

export interface WeeklyBriefData {
  from: string;
  to: string;
  periodLabel: string;
  hours: number;
  minutes: number;
  avgHoursPerActiveDay: number;
  avgHoursPerDay: number;
  activeDays: number;
  totalDays: number;
  consistencyPercent: number;
  completedTasks: number;
  openTasks: number;
  completionRate: number;
  projects: number;
  finishedProjects: number;
  inProgressProjects: number;
  categories: BriefCategorySlice[];
  topProjects: BriefProjectSlice[];
  days: BriefDayRow[];
  peakDay: { date: string; minutes: number } | null;
  quietDay: { date: string; minutes: number } | null;
  signals: BriefSignal[];
  hasActivity: boolean;
}

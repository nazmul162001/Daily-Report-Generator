import { createId } from "@/lib/utils";
import type { BulletItem, ReportTask, WorkBreakdownItem } from "@/types/common";
import type { TodayTaskReport } from "@/features/today-task/types";
import type { DailyReportData } from "@/features/daily-report/types";
import type { DetailedReportData } from "@/features/detailed-report/types";
import { getTodayIsoDate } from "@/lib/date";
import {
  getTaskLabels,
  type TaskLabelScope,
} from "@/lib/taskLabels";

export const DEFAULT_SECTION = "CMS";

export type FixedTaskKey =
  | "feedback-last-day"
  | "feedback-today"
  | "remaining-last-day"
  | "new-actual-today";

export interface FixedTaskDef {
  key: FixedTaskKey;
  title: string;
  included: boolean;
  status: "completed" | "ongoing";
}

/** Full checklist used by Daily Report (current defaults). */
export const DAILY_TASK_DEFS: FixedTaskDef[] = [
  {
    key: "feedback-last-day",
    title: "Feedback of last day.",
    included: true,
    status: "completed",
  },
  {
    key: "feedback-today",
    title: "Feedback of today.",
    included: false,
    status: "completed",
  },
  {
    key: "remaining-last-day",
    title: "Remaining cases of last day.",
    included: true,
    status: "completed",
  },
  {
    key: "new-actual-today",
    title: "New actual cases today.",
    included: true,
    status: "ongoing",
  },
];

/** Today's Task list — no “Feedback of today”. */
export const TODAY_TASK_DEFS: FixedTaskDef[] = DAILY_TASK_DEFS.filter(
  (task) => task.key !== "feedback-today",
);

export const DEFAULT_WORK_BREAKDOWN: Array<{
  category: string;
  minutes: string;
  isNA: boolean;
}> = [
  { category: "Revision", minutes: "294", isNA: false },
  { category: "Feedback Response", minutes: "72", isNA: false },
  { category: "Meeting", minutes: "60", isNA: false },
  {
    category: "Question Response (Support & Learning)",
    minutes: "60",
    isNA: false,
  },
  { category: "Review", minutes: "", isNA: true },
  { category: "Investigation", minutes: "", isNA: true },
];

export const DEFAULT_RECIPIENTS = [
  "Yuya Shimizu（শিমিজু）",
  "Shahriar Ahmed Shawon",
] as const;

export const DEFAULT_GOAL_REVIEW = [
  "Addressed all received feedback.",
] as const;

export const DEFAULT_TOMORROW_GOALS = [
  "Minimize the number of feedback by improving code quality.",
  "Ensure all assigned cases are completed on the same day.",
] as const;

function taskDefsFor(scope: TaskLabelScope): FixedTaskDef[] {
  return scope === "today-task" ? TODAY_TASK_DEFS : DAILY_TASK_DEFS;
}

function toBinaryStatus(
  status: ReportTask["status"] | undefined,
  fallback: "completed" | "ongoing",
): "completed" | "ongoing" {
  if (status === "completed" || status === "ongoing") {
    return status;
  }
  return fallback;
}

/** Match legacy drafts / custom titles back to a stable key. */
export function matchFixedTaskKey(title: string): FixedTaskKey | null {
  const normalized = title.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.includes("feedback") && normalized.includes("today")) {
    return "feedback-today";
  }
  if (normalized.includes("feedback") && normalized.includes("last")) {
    return "feedback-last-day";
  }
  if (normalized.includes("remaining")) {
    return "remaining-last-day";
  }
  if (normalized.includes("new actual") || normalized.includes("new case")) {
    return "new-actual-today";
  }
  return null;
}

function resolveKey(task: ReportTask): FixedTaskKey | null {
  if (
    task.key === "feedback-last-day" ||
    task.key === "feedback-today" ||
    task.key === "remaining-last-day" ||
    task.key === "new-actual-today"
  ) {
    return task.key;
  }
  return matchFixedTaskKey(task.title);
}

/**
 * Align tasks to the fixed checklist for a tab.
 * Titles: permanent local labels → draft title → built-in default.
 */
export function normalizeFixedTasks(
  existing: ReportTask[] | undefined,
  withStatus: boolean,
  scope: TaskLabelScope = "daily-report",
): ReportTask[] {
  const defs = taskDefsFor(scope);
  const labels = getTaskLabels(scope);

  return defs.map((def) => {
    const match = existing?.find((task) => resolveKey(task) === def.key);
    const title =
      labels[def.key]?.trim() ||
      match?.title?.trim() ||
      def.title;

    return {
      id: match?.id || createId("task"),
      key: def.key,
      title,
      included: match?.included ?? def.included,
      status: withStatus
        ? toBinaryStatus(match?.status, def.status)
        : undefined,
    };
  });
}

export function createDefaultTodayTask(): TodayTaskReport {
  return {
    id: createId("today"),
    date: getTodayIsoDate(),
    section: DEFAULT_SECTION,
    tasks: normalizeFixedTasks(undefined, false, "today-task"),
  };
}

export function createDefaultDailyReport(): DailyReportData {
  return {
    id: createId("daily"),
    date: getTodayIsoDate(),
    section: DEFAULT_SECTION,
    tasks: normalizeFixedTasks(undefined, true, "daily-report"),
  };
}

export function createDefaultDetailedReport(): DetailedReportData {
  return {
    id: createId("detailed"),
    date: getTodayIsoDate(),
    recipients: DEFAULT_RECIPIENTS.map((name) => ({
      id: createId("recipient"),
      name,
    })),
    workBreakdown: DEFAULT_WORK_BREAKDOWN.map(
      (item): WorkBreakdownItem => ({
        id: createId("wb"),
        category: item.category,
        minutes: item.minutes,
        isNA: item.isNA,
      }),
    ),
    goalReview: DEFAULT_GOAL_REVIEW.map(
      (text): BulletItem => ({ id: createId("goal"), text }),
    ),
    tomorrowGoals: DEFAULT_TOMORROW_GOALS.map(
      (text): BulletItem => ({ id: createId("tomorrow"), text }),
    ),
  };
}

/** Migrate old drafts: force fixed recipients, hours → minutes. */
export function normalizeDetailedReport(
  draft: Partial<DetailedReportData> & {
    workBreakdown?: Array<
      Partial<WorkBreakdownItem> & { hours?: string; minutes?: string }
    >;
  },
): DetailedReportData {
  const base = createDefaultDetailedReport();

  const workBreakdown =
    draft.workBreakdown && draft.workBreakdown.length > 0
      ? draft.workBreakdown.map((item) => {
          let minutes = item.minutes?.trim() ?? "";
          if (!minutes && item.hours?.trim()) {
            const hours = Number(item.hours.trim());
            if (Number.isFinite(hours) && hours >= 0) {
              minutes = String(Math.round(hours * 60));
            }
          }
          return {
            id: item.id || createId("wb"),
            category: item.category ?? "",
            minutes,
            isNA: Boolean(item.isNA),
          };
        })
      : base.workBreakdown;

  return {
    id: draft.id || base.id,
    date: draft.date || base.date,
    recipients: base.recipients,
    workBreakdown,
    goalReview:
      draft.goalReview && draft.goalReview.length > 0
        ? draft.goalReview
        : base.goalReview,
    tomorrowGoals:
      draft.tomorrowGoals && draft.tomorrowGoals.length > 0
        ? draft.tomorrowGoals
        : base.tomorrowGoals,
  };
}

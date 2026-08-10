import { createId } from "@/lib/utils";
import type { BulletItem, ReportTask, WorkBreakdownItem } from "@/types/common";
import type { TodayTaskReport } from "@/features/today-task/types";
import type { DailyReportData } from "@/features/daily-report/types";
import type { DetailedReportData } from "@/features/detailed-report/types";
import { getTodayIsoDate } from "@/lib/date";

export const DEFAULT_SECTION = "CMS";

/** Fixed task checklist used by Today Task and Daily Report. */
export const FIXED_TASK_TITLES = [
  "Feedback of last day.",
  "Feedback of today.",
  "Remaining cases of last day.",
  "New actual cases today.",
] as const;

export type FixedTaskTitle = (typeof FIXED_TASK_TITLES)[number];

export const DEFAULT_FIXED_TASKS: Array<{
  title: FixedTaskTitle;
  included: boolean;
  status: "completed" | "ongoing";
}> = [
  { title: "Feedback of last day.", included: true, status: "completed" },
  { title: "Feedback of today.", included: false, status: "completed" },
  { title: "Remaining cases of last day.", included: true, status: "completed" },
  { title: "New actual cases today.", included: true, status: "ongoing" },
];

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

function createFixedTask(
  title: string,
  options: {
    included: boolean;
    status?: "completed" | "ongoing";
  },
): ReportTask {
  return {
    id: createId("task"),
    title,
    included: options.included,
    status: options.status,
  };
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

/** Ensure draft/saved tasks align with the fixed checklist. */
export function normalizeFixedTasks(
  existing: ReportTask[] | undefined,
  withStatus: boolean,
): ReportTask[] {
  return DEFAULT_FIXED_TASKS.map((def) => {
    const match = existing?.find(
      (task) => matchFixedTaskTitle(task.title) === def.title,
    );
    return {
      id: match?.id || createId("task"),
      title: def.title,
      included: match?.included ?? def.included,
      status: withStatus
        ? toBinaryStatus(match?.status, def.status)
        : undefined,
    };
  });
}

function matchFixedTaskTitle(title: string): FixedTaskTitle | null {
  const normalized = title.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.includes("feedback") && normalized.includes("today")) {
    return "Feedback of today.";
  }
  if (normalized.includes("feedback") && normalized.includes("last")) {
    return "Feedback of last day.";
  }
  if (normalized.includes("remaining")) {
    return "Remaining cases of last day.";
  }
  if (normalized.includes("new actual") || normalized.includes("new case")) {
    return "New actual cases today.";
  }
  return null;
}

export function createDefaultTodayTask(): TodayTaskReport {
  return {
    id: createId("today"),
    date: getTodayIsoDate(),
    section: DEFAULT_SECTION,
    tasks: DEFAULT_FIXED_TASKS.map((task) =>
      createFixedTask(task.title, { included: task.included }),
    ),
  };
}

export function createDefaultDailyReport(): DailyReportData {
  return {
    id: createId("daily"),
    date: getTodayIsoDate(),
    section: DEFAULT_SECTION,
    tasks: DEFAULT_FIXED_TASKS.map((task) =>
      createFixedTask(task.title, {
        included: task.included,
        status: task.status,
      }),
    ),
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

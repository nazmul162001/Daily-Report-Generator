import { createId } from "@/lib/utils";
import type { BulletItem, ReportTask, WorkBreakdownItem } from "@/types/common";
import type { TodayTaskReport } from "@/features/today-task/types";
import type { DailyReportData } from "@/features/daily-report/types";
import type { DetailedReportData } from "@/features/detailed-report/types";
import { getTodayIsoDate } from "@/lib/date";
import { getTaskCatalog, type TaskLabelScope } from "@/lib/taskLabels";
import {
  DAILY_TASK_DEFS,
  TODAY_TASK_DEFS,
  type FixedTaskKey,
  type FixedTaskDef,
} from "@/data/taskDefs";

export const DEFAULT_SECTION = "CMS";

export type { FixedTaskKey, FixedTaskDef };
export { DAILY_TASK_DEFS, TODAY_TASK_DEFS };

export const DEFAULT_WORK_BREAKDOWN: Array<{
  category: string;
  minutes: string;
  isNA: boolean;
}> = [
  // Defaults stored in minutes; hours shown: 4.9, 1.2, 1, 1, —, 1.7
  { category: "Revision", minutes: "294", isNA: false },
  { category: "Feedback Response", minutes: "72", isNA: false },
  { category: "Meeting", minutes: "60", isNA: false },
  {
    category: "Question Response (Support & Learning)",
    minutes: "60",
    isNA: true,
  },
  { category: "Review", minutes: "", isNA: true },
  { category: "Investigation", minutes: "102", isNA: false },
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

function resolveKey(task: ReportTask): string | null {
  if (task.key?.trim()) {
    return task.key.trim();
  }
  return matchFixedTaskKey(task.title);
}

/**
 * Build the task list from the local catalog (defaults + user-added).
 * Titles/membership from permanent local catalog; include/status from draft.
 */
export function normalizeFixedTasks(
  existing: ReportTask[] | undefined,
  withStatus: boolean,
  scope: TaskLabelScope = "daily-report",
): ReportTask[] {
  const catalog = getTaskCatalog(scope);
  const defs = taskDefsFor(scope);
  const defByKey = new Map(defs.map((def) => [def.key, def]));

  const catalogKeys = new Set(catalog.map((item) => item.key));
  const draftOnlyCustoms =
    existing?.filter((task) => {
      const key = resolveKey(task);
      return (
        key &&
        key.startsWith("custom-") &&
        !catalogKeys.has(key) &&
        task.title.trim()
      );
    }) ?? [];

  const entries = [
    ...catalog,
    ...draftOnlyCustoms.map((task) => ({
      key: resolveKey(task)!,
      title: task.title.trim(),
    })),
  ];

  return entries.map((item) => {
    const def = defByKey.get(item.key as FixedTaskKey);
    const match = existing?.find((task) => resolveKey(task) === item.key);

    return {
      id: match?.id || createId("task"),
      key: item.key,
      title: item.title.trim() || def?.title || "New task",
      included: match?.included ?? def?.included ?? true,
      status: withStatus
        ? toBinaryStatus(match?.status, def?.status ?? "completed")
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
    // Allow empty arrays (user deleted all — section omitted from copy)
    goalReview: Array.isArray(draft.goalReview)
      ? draft.goalReview
      : base.goalReview,
    tomorrowGoals: Array.isArray(draft.tomorrowGoals)
      ? draft.tomorrowGoals
      : base.tomorrowGoals,
    revisionManuallyEdited: draft.revisionManuallyEdited,
  };
}

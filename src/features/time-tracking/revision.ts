import { DEFAULT_WORK_BREAKDOWN } from "@/data/defaultTemplates";
import type { DetailedReportData } from "@/features/detailed-report/types";
import type { WorkBreakdownItem } from "@/types/common";
import { getTodayTrackedMinutes, hasTodayTrackingActivity } from "./storage";

export const REVISION_CATEGORY = "Revision";

export const DEFAULT_REVISION_MINUTES =
  DEFAULT_WORK_BREAKDOWN.find((row) => row.category === REVISION_CATEGORY)
    ?.minutes ?? "294";

export function isRevisionItem(item: WorkBreakdownItem): boolean {
  return item.category.trim().toLowerCase() === REVISION_CATEGORY.toLowerCase();
}

export function findRevisionItem(
  items: WorkBreakdownItem[],
): WorkBreakdownItem | undefined {
  return items.find(isRevisionItem);
}

function revisionLooksCustom(item: WorkBreakdownItem): boolean {
  if (item.isNA) {
    return true;
  }
  const minutes = item.minutes.trim();
  return minutes !== "" && minutes !== DEFAULT_REVISION_MINUTES;
}

/**
 * Apply today's Time Tracking total as the Revision default.
 * Does not overwrite a value the user has already changed.
 * Yesterday's tracking never affects this — only the local "today".
 */
export function applyTrackingRevisionDefault(
  report: DetailedReportData,
  options?: { now?: number },
): DetailedReportData {
  if (report.revisionManuallyEdited) {
    return report;
  }

  const now = options?.now ?? Date.now();
  const hasActivity = hasTodayTrackingActivity({ now });
  if (!hasActivity) {
    return report;
  }

  const trackedMinutes = getTodayTrackedMinutes({
    includeRunning: true,
    now,
  });
  const rounded = Math.round(trackedMinutes);
  if (rounded <= 0) {
    return report;
  }

  const revision = findRevisionItem(report.workBreakdown);
  if (!revision) {
    return report;
  }

  if (
    report.revisionManuallyEdited === undefined &&
    revisionLooksCustom(revision)
  ) {
    return { ...report, revisionManuallyEdited: true };
  }

  const nextMinutes = String(rounded);
  if (revision.minutes === nextMinutes && revision.isNA === false) {
    if (report.revisionManuallyEdited === false) {
      return report;
    }
    return { ...report, revisionManuallyEdited: false };
  }

  return {
    ...report,
    revisionManuallyEdited: false,
    workBreakdown: report.workBreakdown.map((item) =>
      item.id === revision.id
        ? { ...item, minutes: nextMinutes, isNA: false }
        : item,
    ),
  };
}

export function didRevisionFieldsChange(
  previous: WorkBreakdownItem[],
  next: WorkBreakdownItem[],
): boolean {
  const prevRevision = findRevisionItem(previous);
  const nextRevision = findRevisionItem(next);
  if (!prevRevision && !nextRevision) {
    return false;
  }
  if (!prevRevision || !nextRevision) {
    return true;
  }
  return (
    prevRevision.minutes !== nextRevision.minutes ||
    prevRevision.isNA !== nextRevision.isNA ||
    prevRevision.category !== nextRevision.category
  );
}

import { formatDisplayDate } from "@/lib/date";
import { buildSlackCodeReport } from "@/lib/slackCopy";
import type { ReportStatus } from "@/types/common";
import { STATUS_LABELS, type DailyReportData } from "./types";

export function formatStatusLabel(status: ReportStatus | undefined): string {
  if (status === "ongoing") {
    return STATUS_LABELS.ongoing;
  }
  return STATUS_LABELS.completed;
}

function formatCmsBlock(
  section: string,
  tasks: DailyReportData["tasks"],
): string {
  const lines = [`${section.trim() || "CMS"}:`];

  for (const task of tasks) {
    if (task.included === false) {
      continue;
    }
    const title = task.title.trim();
    if (!title) {
      continue;
    }
    lines.push(`-> ${title} [${formatStatusLabel(task.status)}]`);
  }

  return lines.join("\n");
}

export function formatDailyReport(report: DailyReportData): string {
  return buildSlackCodeReport({
    title: "Daily Report",
    date: formatDisplayDate(report.date),
    codeBlock: formatCmsBlock(report.section, report.tasks),
  }).text;
}

export function formatDailyReportHtml(report: DailyReportData): string {
  return buildSlackCodeReport({
    title: "Daily Report",
    date: formatDisplayDate(report.date),
    codeBlock: formatCmsBlock(report.section, report.tasks),
  }).html;
}

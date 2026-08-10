import { formatDisplayDate } from "@/lib/date";
import { buildSlackCodeReport } from "@/lib/slackCopy";
import type { TodayTaskReport } from "./types";

function formatCmsBlock(
  section: string,
  tasks: TodayTaskReport["tasks"],
): string {
  const lines = [`${section.trim() || "CMS"}:`];

  for (const task of tasks) {
    if (task.included === false) {
      continue;
    }
    const title = task.title.trim();
    if (title) {
      lines.push(`→ ${title}`);
    }
  }

  return lines.join("\n");
}

export function formatTodayTaskReport(report: TodayTaskReport): string {
  return buildSlackCodeReport({
    title: "Today's Task",
    date: formatDisplayDate(report.date),
    codeBlock: formatCmsBlock(report.section, report.tasks),
  }).text;
}

export function formatTodayTaskReportHtml(report: TodayTaskReport): string {
  return buildSlackCodeReport({
    title: "Today's Task",
    date: formatDisplayDate(report.date),
    codeBlock: formatCmsBlock(report.section, report.tasks),
  }).html;
}

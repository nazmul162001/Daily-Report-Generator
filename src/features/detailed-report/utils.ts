import {
  formatDurationLabel,
  parseMinutes,
} from "./duration";
import type { DetailedReportData } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatRecipientsLine(report: DetailedReportData): string {
  return report.recipients
    .map((r) => r.name.trim())
    .filter(Boolean)
    .map((name) => `@${name} san`)
    .join(", ");
}

/**
 * Plain-text preview / text/plain clipboard.
 * Clean display without markdown asterisks; HTML clipboard applies real bold in Slack.
 */
export function formatDetailedReport(report: DetailedReportData): string {
  const recipients = formatRecipientsLine(report);
  const lines: string[] = [];

  if (recipients) {
    lines.push(recipients);
    lines.push("");
  }

  lines.push("Work Breakdown");
  lines.push("");

  for (const item of report.workBreakdown) {
    const category = item.category.trim();
    if (!category) {
      continue;
    }
    lines.push(
      `• ${category}: ${formatDurationLabel(item.minutes, item.isNA)}`,
    );
  }

  lines.push("");
  lines.push("Goal Review");
  lines.push("");

  for (const goal of report.goalReview) {
    const text = goal.text.trim();
    if (text) {
      lines.push(`• ${text}`);
    }
  }

  lines.push("");
  lines.push("Goals for Tomorrow");
  lines.push("");

  for (const goal of report.tomorrowGoals) {
    const text = goal.text.trim();
    if (text) {
      lines.push(`• ${text}`);
    }
  }

  return lines.join("\n");
}

/**
 * HTML for Slack rich paste:
 * - plain section headings
 * - bold category names only
 * - real bullet lists
 */
export function formatDetailedReportHtml(report: DetailedReportData): string {
  const recipients = formatRecipientsLine(report);
  const parts: string[] = [];

  if (recipients) {
    parts.push(`<div>${escapeHtml(recipients)}</div>`);
    parts.push("<div><br></div>");
  }

  parts.push("<div>Work Breakdown</div>");
  parts.push("<ul>");
  for (const item of report.workBreakdown) {
    const category = item.category.trim();
    if (!category) {
      continue;
    }
    const duration = formatDurationLabel(item.minutes, item.isNA);
    parts.push(
      `<li><strong>${escapeHtml(category)}:</strong> ${escapeHtml(duration)}</li>`,
    );
  }
  parts.push("</ul>");

  parts.push("<div>Goal Review</div>");
  parts.push("<ul>");
  for (const goal of report.goalReview) {
    const text = goal.text.trim();
    if (text) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
  }
  parts.push("</ul>");

  parts.push("<div>Goals for Tomorrow</div>");
  parts.push("<ul>");
  for (const goal of report.tomorrowGoals) {
    const text = goal.text.trim();
    if (text) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
  }
  parts.push("</ul>");

  return [
    "<html><body>",
    "<!--StartFragment-->",
    parts.join(""),
    "<!--EndFragment-->",
    "</body></html>",
  ].join("");
}

export { parseMinutes, formatDurationLabel };

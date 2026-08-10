import { DEFAULT_RECIPIENTS } from "@/data/defaultTemplates";
import {
  formatDurationLabel,
  parseMinutes,
} from "./duration";
import type { DetailedReportData } from "./types";
import type { BulletItem } from "@/types/common";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Fixed Slack mention line — workspace display names. */
export function formatRecipientsLine(): string {
  return DEFAULT_RECIPIENTS.map((name) => `@${name} san`).join(", ");
}

function filledGoals(items: BulletItem[]): string[] {
  return items.map((item) => item.text.trim()).filter(Boolean);
}

/**
 * Plain-text preview / text/plain clipboard.
 * Goal sections omitted when empty.
 */
export function formatDetailedReport(report: DetailedReportData): string {
  const lines: string[] = [];

  lines.push(formatRecipientsLine());
  lines.push("");

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

  const goalReview = filledGoals(report.goalReview);
  if (goalReview.length > 0) {
    lines.push("");
    lines.push("Goal Review");
    lines.push("");
    for (const text of goalReview) {
      lines.push(`• ${text}`);
    }
  }

  const tomorrowGoals = filledGoals(report.tomorrowGoals);
  if (tomorrowGoals.length > 0) {
    lines.push("");
    lines.push("Goals for Tomorrow");
    lines.push("");
    for (const text of tomorrowGoals) {
      lines.push(`• ${text}`);
    }
  }

  return lines.join("\n");
}

/**
 * HTML for Slack rich paste.
 * Goal sections omitted when empty.
 */
export function formatDetailedReportHtml(report: DetailedReportData): string {
  const parts: string[] = [];

  const mentionSpans = DEFAULT_RECIPIENTS.map((name, index) => {
    const mention = `@${escapeHtml(name)} san`;
    const sep = index > 0 ? ", " : "";
    return `${sep}<span>${mention}</span>`;
  }).join("");
  parts.push(`<div>${mentionSpans}</div>`);
  parts.push("<div><br></div>");

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

  const goalReview = filledGoals(report.goalReview);
  if (goalReview.length > 0) {
    parts.push("<div>Goal Review</div>");
    parts.push("<ul>");
    for (const text of goalReview) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
    parts.push("</ul>");
  }

  const tomorrowGoals = filledGoals(report.tomorrowGoals);
  if (tomorrowGoals.length > 0) {
    parts.push("<div>Goals for Tomorrow</div>");
    parts.push("<ul>");
    for (const text of tomorrowGoals) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
    parts.push("</ul>");
  }

  return [
    "<html><body>",
    "<!--StartFragment-->",
    parts.join(""),
    "<!--EndFragment-->",
    "</body></html>",
  ].join("");
}

export { parseMinutes, formatDurationLabel };

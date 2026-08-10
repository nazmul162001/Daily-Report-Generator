import type { DetailedReportData } from "./types";

function formatHours(hours: string, isNA: boolean): string {
  if (isNA || !hours.trim()) {
    return "N/A";
  }
  const value = hours.trim();
  if (value.toLowerCase() === "n/a") {
    return "N/A";
  }
  return `${value} hours`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Slack mrkdwn-friendly plain text.
 * Uses single-asterisk bold (*text*) and bullet points — not GitHub **markdown**.
 */
export function formatDetailedReport(report: DetailedReportData): string {
  const recipients = report.recipients
    .map((r) => r.name.trim())
    .filter(Boolean)
    .map((name) => `@${name} san`)
    .join(", ");

  const lines: string[] = [];

  if (recipients) {
    lines.push(recipients);
    lines.push("");
  }

  lines.push("*Work Breakdown*");
  lines.push("");

  for (const item of report.workBreakdown) {
    const category = item.category.trim();
    if (!category) {
      continue;
    }
    lines.push(`• *${category}:* ${formatHours(item.hours, item.isNA)}`);
  }

  lines.push("");
  lines.push("*Goal Review*");
  lines.push("");

  for (const goal of report.goalReview) {
    const text = goal.text.trim();
    if (text) {
      lines.push(`• ${text}`);
    }
  }

  lines.push("");
  lines.push("*Goals for Tomorrow*");
  lines.push("");

  for (const goal of report.tomorrowGoals) {
    const text = goal.text.trim();
    if (text) {
      lines.push(`• ${text}`);
    }
  }

  return lines.join("\n");
}

/** HTML variant so paste into Slack rich text editor keeps bold + bullets. */
export function formatDetailedReportHtml(report: DetailedReportData): string {
  const recipients = report.recipients
    .map((r) => r.name.trim())
    .filter(Boolean)
    .map((name) => `@${escapeHtml(name)} san`)
    .join(", ");

  const parts: string[] = [];

  if (recipients) {
    parts.push(`<p>${recipients}</p>`);
  }

  parts.push("<p><strong>Work Breakdown</strong></p>");
  parts.push("<ul>");
  for (const item of report.workBreakdown) {
    const category = item.category.trim();
    if (!category) {
      continue;
    }
    parts.push(
      `<li><strong>${escapeHtml(category)}:</strong> ${escapeHtml(formatHours(item.hours, item.isNA))}</li>`,
    );
  }
  parts.push("</ul>");

  parts.push("<p><strong>Goal Review</strong></p>");
  parts.push("<ul>");
  for (const goal of report.goalReview) {
    const text = goal.text.trim();
    if (text) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
  }
  parts.push("</ul>");

  parts.push("<p><strong>Goals for Tomorrow</strong></p>");
  parts.push("<ul>");
  for (const goal of report.tomorrowGoals) {
    const text = goal.text.trim();
    if (text) {
      parts.push(`<li>${escapeHtml(text)}</li>`);
    }
  }
  parts.push("</ul>");

  return parts.join("");
}

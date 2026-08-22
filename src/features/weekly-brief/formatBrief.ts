import {
  formatDisplayDate,
  formatShortMonthDay,
} from "@/lib/date";
import { formatHoursFromMinutes, formatMinutesShort } from "@/lib/duration";
import type { WeeklyBriefData } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rangeLabel(from: string, to: string): string {
  if (from === to) {
    return formatDisplayDate(from);
  }
  return `${formatDisplayDate(from)} → ${formatDisplayDate(to)}`;
}

export type BriefFormatOptions = {
  userName?: string;
  note?: string;
};

/**
 * Clean plain-text weekly brief for Slack / email (no markdown asterisks).
 */
export function formatWeeklyBrief(
  brief: WeeklyBriefData,
  options: BriefFormatOptions = {},
): string {
  const name = options.userName?.trim() || "Team member";
  const note = options.note?.trim();
  const lines: string[] = [];

  lines.push("Weekly Brief");
  lines.push(name);
  lines.push(rangeLabel(brief.from, brief.to));
  lines.push("");

  if (!brief.hasActivity) {
    lines.push("No tracked activity in this period yet.");
    if (note) {
      lines.push("");
      lines.push(`Note: ${note}`);
    }
    return lines.join("\n");
  }

  lines.push("Snapshot");
  lines.push(
    `• Hours logged: ${formatHoursFromMinutes(brief.minutes)} h (${formatMinutesShort(brief.minutes)})`,
  );
  lines.push(
    `• Avg / active day: ${brief.avgHoursPerActiveDay} h · Avg / calendar day: ${brief.avgHoursPerDay} h`,
  );
  lines.push(
    `• Active days: ${brief.activeDays}/${brief.totalDays} (${brief.consistencyPercent}% consistency)`,
  );
  lines.push(
    `• Tasks: ${brief.completedTasks} completed · ${brief.openTasks} open (${brief.completionRate}% done)`,
  );
  lines.push(
    `• Projects: ${brief.projects} touched · ${brief.finishedProjects} finished · ${brief.inProgressProjects} in progress`,
  );
  lines.push("");

  if (brief.days.some((d) => d.minutes > 0 || d.completedTasks > 0)) {
    lines.push("Daily breakdown");
    for (const day of brief.days) {
      if (day.minutes <= 0 && day.completedTasks <= 0 && day.openTasks <= 0) {
        lines.push(`• ${formatShortMonthDay(day.date)}: —`);
        continue;
      }
      const peak = day.isPeak ? " ★ peak" : "";
      lines.push(
        `• ${formatShortMonthDay(day.date)}: ${formatMinutesShort(day.minutes)} (${formatHoursFromMinutes(day.minutes)} h) · ${day.completedTasks} done / ${day.openTasks} open · ${day.projects} project${day.projects === 1 ? "" : "s"}${peak}`,
      );
    }
    lines.push("");
  }

  if (brief.categories.length > 0) {
    lines.push("Where time went");
    for (const slice of brief.categories) {
      lines.push(
        `• ${slice.label}: ${formatMinutesShort(slice.minutes)} (${slice.percent}%)`,
      );
    }
    lines.push("");
  }

  if (brief.topProjects.length > 0) {
    lines.push("Projects");
    for (const project of brief.topProjects) {
      const tasks =
        project.completedTasks + project.openTasks > 0
          ? ` · ${project.completedTasks} done / ${project.openTasks} open`
          : "";
      lines.push(
        `• ${project.name}: ${formatMinutesShort(project.minutes)} (${project.percent}%)${tasks}`,
      );
    }
    lines.push("");
  }

  if (brief.signals.length > 0) {
    lines.push("Key signals");
    for (const signal of brief.signals) {
      lines.push(`• ${signal.label}: ${signal.detail}`);
    }
    lines.push("");
  }

  if (brief.peakDay) {
    lines.push(
      `Peak day: ${formatShortMonthDay(brief.peakDay.date)} (${formatMinutesShort(brief.peakDay.minutes)})`,
    );
  }
  if (brief.quietDay) {
    lines.push(
      `Lightest day: ${formatShortMonthDay(brief.quietDay.date)} (${formatMinutesShort(brief.quietDay.minutes)})`,
    );
  }

  if (note) {
    lines.push("");
    lines.push(`Note: ${note}`);
  }

  return lines.join("\n").trim();
}

/** HTML twin for rich paste into Slack (bold via tags, not asterisks). */
export function formatWeeklyBriefHtml(
  brief: WeeklyBriefData,
  options: BriefFormatOptions = {},
): string {
  const name = options.userName?.trim() || "Team member";
  const note = options.note?.trim();
  const parts: string[] = [];

  parts.push(`<div><strong>Weekly Brief</strong></div>`);
  parts.push(`<div>${escapeHtml(name)}</div>`);
  parts.push(`<div>${escapeHtml(rangeLabel(brief.from, brief.to))}</div>`);
  parts.push(`<div><br></div>`);

  if (!brief.hasActivity) {
    parts.push(`<div>No tracked activity in this period yet.</div>`);
    if (note) {
      parts.push(`<div><br></div>`);
      parts.push(`<div><strong>Note:</strong> ${escapeHtml(note)}</div>`);
    }
    return wrapFragment(parts.join(""));
  }

  parts.push(`<div><strong>Snapshot</strong></div>`);
  parts.push(`<ul>`);
  parts.push(
    `<li><strong>Hours logged:</strong> ${escapeHtml(formatHoursFromMinutes(brief.minutes))} h (${escapeHtml(formatMinutesShort(brief.minutes))})</li>`,
  );
  parts.push(
    `<li><strong>Avg / active day:</strong> ${brief.avgHoursPerActiveDay} h · <strong>Avg / calendar day:</strong> ${brief.avgHoursPerDay} h</li>`,
  );
  parts.push(
    `<li><strong>Active days:</strong> ${brief.activeDays}/${brief.totalDays} (${brief.consistencyPercent}% consistency)</li>`,
  );
  parts.push(
    `<li><strong>Tasks:</strong> ${brief.completedTasks} completed · ${brief.openTasks} open (${brief.completionRate}% done)</li>`,
  );
  parts.push(
    `<li><strong>Projects:</strong> ${brief.projects} touched · ${brief.finishedProjects} finished · ${brief.inProgressProjects} in progress</li>`,
  );
  parts.push(`</ul>`);

  if (brief.days.some((d) => d.minutes > 0 || d.completedTasks > 0)) {
    parts.push(`<div><strong>Daily breakdown</strong></div>`);
    parts.push(`<ul>`);
    for (const day of brief.days) {
      if (day.minutes <= 0 && day.completedTasks <= 0 && day.openTasks <= 0) {
        parts.push(
          `<li>${escapeHtml(formatShortMonthDay(day.date))}: —</li>`,
        );
        continue;
      }
      const peak = day.isPeak ? " ★ peak" : "";
      parts.push(
        `<li><strong>${escapeHtml(formatShortMonthDay(day.date))}:</strong> ${escapeHtml(formatMinutesShort(day.minutes))} (${escapeHtml(formatHoursFromMinutes(day.minutes))} h) · ${day.completedTasks} done / ${day.openTasks} open · ${day.projects} project${day.projects === 1 ? "" : "s"}${peak}</li>`,
      );
    }
    parts.push(`</ul>`);
  }

  if (brief.categories.length > 0) {
    parts.push(`<div><strong>Where time went</strong></div>`);
    parts.push(`<ul>`);
    for (const slice of brief.categories) {
      parts.push(
        `<li><strong>${escapeHtml(slice.label)}:</strong> ${escapeHtml(formatMinutesShort(slice.minutes))} (${slice.percent}%)</li>`,
      );
    }
    parts.push(`</ul>`);
  }

  if (brief.topProjects.length > 0) {
    parts.push(`<div><strong>Projects</strong></div>`);
    parts.push(`<ul>`);
    for (const project of brief.topProjects) {
      const tasks =
        project.completedTasks + project.openTasks > 0
          ? ` · ${project.completedTasks} done / ${project.openTasks} open`
          : "";
      parts.push(
        `<li><strong>${escapeHtml(project.name)}:</strong> ${escapeHtml(formatMinutesShort(project.minutes))} (${project.percent}%)${escapeHtml(tasks)}</li>`,
      );
    }
    parts.push(`</ul>`);
  }

  if (brief.signals.length > 0) {
    parts.push(`<div><strong>Key signals</strong></div>`);
    parts.push(`<ul>`);
    for (const signal of brief.signals) {
      parts.push(
        `<li><strong>${escapeHtml(signal.label)}:</strong> ${escapeHtml(signal.detail)}</li>`,
      );
    }
    parts.push(`</ul>`);
  }

  if (brief.peakDay) {
    parts.push(
      `<div><strong>Peak day:</strong> ${escapeHtml(formatShortMonthDay(brief.peakDay.date))} (${escapeHtml(formatMinutesShort(brief.peakDay.minutes))})</div>`,
    );
  }
  if (brief.quietDay) {
    parts.push(
      `<div><strong>Lightest day:</strong> ${escapeHtml(formatShortMonthDay(brief.quietDay.date))} (${escapeHtml(formatMinutesShort(brief.quietDay.minutes))})</div>`,
    );
  }

  if (note) {
    parts.push(`<div><br></div>`);
    parts.push(`<div><strong>Note:</strong> ${escapeHtml(note)}</div>`);
  }

  return wrapFragment(parts.join(""));
}

function wrapFragment(inner: string): string {
  return [
    "<html><body>",
    "<!--StartFragment-->",
    inner,
    "<!--EndFragment-->",
    "</body></html>",
  ].join("");
}

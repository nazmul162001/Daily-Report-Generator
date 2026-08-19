/** Read a CSS custom property from the document root (client-only). */
export function cssVar(name: string, fallback = ""): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Browser theme-color meta tag value (PWA / mobile chrome). */
export function themeMetaColor(): string {
  return cssVar("--c-theme-meta", cssVar("--color-primary", "#2563eb"));
}

export const CHART_SERIES = [
  {
    key: "projects" as const,
    label: "Projects",
    colorVar: "--color-chart-projects",
  },
  {
    key: "completedTasks" as const,
    label: "Tasks completed",
    colorVar: "--color-chart-tasks",
  },
] as const;

export type ChartSeriesKey = (typeof CHART_SERIES)[number]["key"];

export function chartSeriesColor(colorVar: string, fallback: string): string {
  return cssVar(colorVar, fallback);
}

export function readChartTheme(): { muted: string; grid: string } {
  return {
    muted: cssVar("--color-muted", "#64748b"),
    grid: cssVar("--c-chart-grid", "rgba(148, 163, 184, 0.35)"),
  };
}

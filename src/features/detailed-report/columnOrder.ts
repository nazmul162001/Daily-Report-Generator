import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";

export const REPORT_COLUMN_IDS = ["form", "log", "preview"] as const;

export type ReportColumnId = (typeof REPORT_COLUMN_IDS)[number];

export const DEFAULT_COLUMN_ORDER: ReportColumnId[] = [
  "form",
  "log",
  "preview",
];

export function isReportColumnId(value: string): value is ReportColumnId {
  return REPORT_COLUMN_IDS.includes(value as ReportColumnId);
}

export function normalizeColumnOrder(raw: unknown): ReportColumnId[] {
  const incoming = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : [];
  const next: ReportColumnId[] = [];
  for (const id of incoming) {
    if (isReportColumnId(id) && !next.includes(id)) {
      next.push(id);
    }
  }
  for (const id of DEFAULT_COLUMN_ORDER) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }
  return next;
}

export function loadColumnOrder(): ReportColumnId[] {
  return normalizeColumnOrder(
    getStorageItem<unknown>(STORAGE_KEYS.detailedReportColumns, null),
  );
}

export function saveColumnOrder(order: ReportColumnId[]): void {
  setStorageItem(STORAGE_KEYS.detailedReportColumns, normalizeColumnOrder(order));
}

export const LOG_COLUMN_WIDTH = "26rem";

export const MIN_COLUMN_PX: Record<ReportColumnId, number> = {
  form: 280,
  log: 256,
  preview: 280,
};

/** Session-only relative weights used as `fr` tracks. `log: null` keeps the default 26rem. */
export type ColumnWidthMap = {
  form: number;
  preview: number;
  log: number | null;
};

export function columnTrack(
  id: ReportColumnId,
  logOpen: boolean,
  widths: ColumnWidthMap | null = null,
): string {
  if (id === "log") {
    if (!logOpen) {
      return "0px";
    }
    if (widths?.log != null) {
      return `${Math.round(widths.log)}px`;
    }
    return LOG_COLUMN_WIDTH;
  }
  if (!widths) {
    if (id === "form") {
      return "minmax(0,1.05fr)";
    }
    return "minmax(0,0.95fr)";
  }
  return `minmax(18rem, ${widths[id]}fr)`;
}

export function columnLabel(id: ReportColumnId): string {
  switch (id) {
    case "form":
      return "Work breakdown";
    case "log":
      return "Live log";
    default:
      return "Generated report";
  }
}

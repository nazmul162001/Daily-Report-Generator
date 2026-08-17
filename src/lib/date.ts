/**
 * Centralized date helpers.
 * Generated reports always use DD-MM-YYYY.
 */

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convert YYYY-MM-DD → DD-MM-YYYY */
export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}-${month}-${year}`;
}

/** Convert DD-MM-YYYY → YYYY-MM-DD for date inputs */
export function parseDisplayDateToIso(displayDate: string): string {
  const match = displayDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return getTodayIsoDate();
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseIsoDateParts(
  isoDate: string,
): { year: number; month: number; day: number } | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  return { year, month, day };
}

/** Add calendar days using the user's local timezone (not UTC). */
export function addLocalDays(isoDate: string, delta: number): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) {
    return getTodayIsoDate();
  }
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inclusive cutoff for keeping `keepDays` local calendar days ending today. */
export function getLocalRetentionCutoffIso(
  keepDays: number,
  today = getTodayIsoDate(),
): string {
  const span = Math.max(1, Math.floor(keepDays));
  return addLocalDays(today, -(span - 1));
}

export function endOfLocalDayMs(isoDate: string): number {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) {
    return Date.now();
  }
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    23,
    59,
    59,
    999,
  ).getTime();
}


/**
 * Centralized date helpers.
 * Generated reports always use DD-MM-YYYY.
 */

export function getTodayIsoDate(): string {
  return isoDateFromLocalMs(Date.now());
}

/** Local calendar day for a timestamp (browser/OS timezone, not UTC). */
export function isoDateFromLocalMs(ms: number): string {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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

/** First day of the local calendar month that contains `isoDate`. */
export function startOfLocalMonth(isoDate = getTodayIsoDate()): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) {
    return startOfLocalMonth(getTodayIsoDate());
  }
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;
}

export function eachLocalDay(fromIso: string, toIso: string): string[] {
  const from = fromIso <= toIso ? fromIso : toIso;
  const to = fromIso <= toIso ? toIso : fromIso;
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addLocalDays(cursor, 1);
    if (days.length > 400) {
      break;
    }
  }
  return days;
}

/** e.g. "Aug 18" */
export function formatShortMonthDay(isoDate: string): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) {
    return isoDate;
  }
  return new Date(parts.year, parts.month - 1, parts.day).toLocaleString(
    "en-US",
    { month: "short", day: "2-digit" },
  );
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

export interface YearMonth {
  year: number;
  month: number;
}

export function getYearMonth(isoDate: string): YearMonth {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: parts.year, month: parts.month };
}

export function addYearMonths(
  yearMonth: YearMonth,
  delta: number,
): YearMonth {
  const date = new Date(yearMonth.year, yearMonth.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function compareYearMonths(a: YearMonth, b: YearMonth): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return a.month - b.month;
}

/** e.g. "Sep, 2026" */
export function formatMonthYear(yearMonth: YearMonth): string {
  const label = new Date(yearMonth.year, yearMonth.month - 1, 1).toLocaleString(
    "en-US",
    { month: "short", year: "numeric" },
  );
  return label.replace(" ", ", ");
}

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Sunday-start 6×7 grid for a local calendar month. */
export function getMonthGrid(yearMonth: YearMonth): CalendarCell[] {
  const first = new Date(yearMonth.year, yearMonth.month - 1, 1);
  const start = new Date(
    yearMonth.year,
    yearMonth.month - 1,
    1 - first.getDay(),
  );
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    cells.push({
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: year === yearMonth.year && month === yearMonth.month,
    });
  }

  return cells;
}


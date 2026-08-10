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

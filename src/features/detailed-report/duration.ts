/**
 * Minutes → hours helpers for detailed report work breakdown.
 */

export function parseMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num;
}

/** Format hours with up to 2 decimals (e.g. 0.75, 3.28, 1). */
export function formatHoursFromMinutes(minutes: number): string {
  const hours = minutes / 60;
  const rounded = Math.round(hours * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2);
}

/**
 * Copy text for duration:
 * - N/A when empty / flagged
 * - `197 minutes (3.28 hours)` otherwise
 */
export function formatDurationLabel(
  minutesValue: string,
  isNA: boolean,
): string {
  if (isNA) {
    return "N/A";
  }
  const minutes = parseMinutes(minutesValue);
  if (minutes === null) {
    return "N/A";
  }
  const minsLabel = Number.isInteger(minutes)
    ? String(minutes)
    : String(minutes);
  return `${minsLabel} minutes (${formatHoursFromMinutes(minutes)} hours)`;
}

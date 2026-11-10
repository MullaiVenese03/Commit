/**
 * Date and calendar utilities for nominal calendar-day (YYYY-MM-DD) processing.
 *
 * All operations here operate purely on calendar dates without local time-of-day
 * or local timezone conversions, guaranteeing idempotent calculations across
 * all client and server timezones.
 */

export const CALENDAR_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validates whether a string is a strictly valid nominal calendar date (YYYY-MM-DD).
 * Correctly accounts for leap years and month day limits (e.g., rejects 2026-02-29 and 2026-04-31).
 */
export function isValidCalendarDate(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  if (!CALENDAR_DATE_REGEX.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonths[month - 1];
}

/**
 * Shifts a nominal calendar date by a given number of days (+/-).
 * Uses UTC date calculations to prevent any daylight saving or timezone shifts.
 */
export function shiftCalendarDate(dateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

/**
 * Calculates the number of calendar days between earlierDateStr and laterDateStr (later - earlier).
 */
export function getCalendarDaysDiff(
  earlierDateStr: string,
  laterDateStr: string,
): number {
  const [y1, m1, d1] = earlierDateStr.split('-').map(Number);
  const [y2, m2, d2] = laterDateStr.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Extracts a nominal YYYY-MM-DD string from a Date object (such as Prisma @db.Date).
 */
export function extractNominalDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns current server UTC calendar date as default fallback.
 */
export function getTodayCalendarDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the Monday and Sunday [weekStart, weekEnd] boundaries of the ISO week containing the given date.
 * ISO week definition: Monday (day 1) 00:00:00 through Sunday (day 7) 23:59:59.
 */
export function getIsoWeekBounds(dateStr: string): {
  weekStart: string;
  weekEnd: string;
} {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  // JavaScript getUTCDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  // ISO day of week index: Monday=0, Tuesday=1, ..., Sunday=6
  const isoDayIndex = (utcDate.getUTCDay() + 6) % 7;

  const weekStart = shiftCalendarDate(dateStr, -isoDayIndex);
  const weekEnd = shiftCalendarDate(dateStr, 6 - isoDayIndex);

  return { weekStart, weekEnd };
}


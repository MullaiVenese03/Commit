import { AxiosError } from 'axios';
import type { ApiError } from '../types';

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Returns today's nominal date formatted as YYYY-MM-DD in the browser's local timezone.
 */
export function getLocalTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Subtracts months from a nominal calendar date (YYYY-MM-DD) in pure UTC,
 * safely clamping the day of the month to the last valid day of the target month
 * to prevent calendar month overflow.
 */
export function subtractCalendarMonths(dateStr: string, monthsToSubtract: number): string {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  const totalMonths = year * 12 + (month - 1) - monthsToSubtract;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12 + 1;

  const isLeapYear =
    (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
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

  const maxDaysInTargetMonth = daysInMonths[targetMonth - 1];
  const clampedDay = Math.min(day, maxDaysInTargetMonth);

  const yPadded = String(targetYear).padStart(4, '0');
  const mPadded = String(targetMonth).padStart(2, '0');
  const dPadded = String(clampedDay).padStart(2, '0');

  return `${yPadded}-${mPadded}-${dPadded}`;
}

/**
 * Shifts a nominal calendar date string (YYYY-MM-DD) by a given number of days.
 * Uses pure UTC calculation to avoid local timezone shifts or daylight savings anomalies.
 */
export function shiftCalendarDays(dateStr: string, days: number): string {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  const dt = new Date(Date.UTC(year, month - 1, day + days));
  const targetYear = dt.getUTCFullYear();
  const targetMonth = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const targetDay = String(dt.getUTCDate()).padStart(2, '0');

  return `${targetYear}-${targetMonth}-${targetDay}`;
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercentage(value: number): string {
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
}

/**
 * Formats a duration in minutes into verbose hours and minutes (e.g., "10 hours", "7 hours", "1 hour 30 mins").
 */
export function formatHoursAndMinutes(totalMinutes: number): string {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '0 hours';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

/**
 * Formats a nominal date range (YYYY-MM-DD to YYYY-MM-DD) safely without UTC timezone shift.
 */
export function formatDateRange(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '-';
  const sParts = startStr.split('-').map(Number);
  const eParts = endStr.split('-').map(Number);
  if (sParts.length !== 3 || eParts.length !== 3) return `${startStr} – ${endStr}`;

  const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2]);
  const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2]);

  const sMonth = sDate.toLocaleDateString(undefined, { month: 'short' });
  const eMonth = eDate.toLocaleDateString(undefined, { month: 'short' });
  const sDay = sDate.getDate();
  const eDay = eDate.getDate();
  const sYear = sDate.getFullYear();
  const eYear = eDate.getFullYear();

  if (sYear === eYear) {
    if (sMonth === eMonth) {
      return `${sMonth} ${sDay} – ${eDay}, ${sYear}`;
    }
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
  }
  return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      return data.message;
    }
    if (data?.error) {
      return data.error;
    }
    if (error.response?.status === 401) {
      return 'Authentication required or session expired. Please log in.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    return error.message || 'An unexpected network error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

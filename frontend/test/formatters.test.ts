import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatHoursAndMinutes,
  formatMinutes,
  formatPercentage,
  getErrorMessage,
  getLocalTodayDate,
  shiftCalendarDays,
  subtractCalendarMonths,
} from '../src/utils/formatters.ts';

describe('Formatters utility tests', () => {
  it('formats minutes into human readable hours and minutes', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(125)).toBe('2h 5m');
    expect(formatMinutes(-10)).toBe('0m');
  });

  it('formats percentages correctly bounded between 0 and 100', () => {
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(45.6)).toBe('46%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(150)).toBe('100%');
    expect(formatPercentage(-20)).toBe('0%');
  });

  it('formats dates consistently', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('invalid-date')).toBe('-');
    const validDate = '2026-10-15T12:00:00.000Z';
    const result = formatDate(validDate);
    expect(result.includes('2026') || result.includes('Oct')).toBe(true);
  });

  it('formats date and time', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('invalid-date')).toBe('-');
    const validDate = '2026-10-15T14:30:00.000Z';
    const result = formatDateTime(validDate);
    expect(result.length).toBeGreaterThan(5);
  });

  it('extracts error messages from various error types', () => {
    expect(getErrorMessage(new Error('Sample error'))).toBe('Sample error');
    expect(getErrorMessage('String error')).toBe('An unexpected error occurred.');
  });

  describe('getLocalTodayDate', () => {
    it('returns nominal calendar date matching YYYY-MM-DD pattern', () => {
      const today = getLocalTodayDate();
      expect(/^\d{4}-\d{2}-\d{2}$/.test(today)).toBe(true);
    });
  });

  describe('shiftCalendarDays', () => {
    it('shifts days forward and backward across month and year boundaries', () => {
      expect(shiftCalendarDays('2026-11-09', 1)).toBe('2026-11-10');
      expect(shiftCalendarDays('2026-11-09', -1)).toBe('2026-11-08');
      expect(shiftCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(shiftCalendarDays('2027-01-01', -1)).toBe('2026-12-31');
      expect(shiftCalendarDays('2024-03-01', -1)).toBe('2024-02-29'); // Leap year
      expect(shiftCalendarDays('2026-03-01', -1)).toBe('2026-02-28'); // Non-leap year
    });
  });

  describe('subtractCalendarMonths', () => {
    it('handles month-end overflow by clamping to target month end', () => {
      // May 31 minus 3 months in non-leap year (2026) clamps to Feb 28
      expect(subtractCalendarMonths('2026-05-31', 3)).toBe('2026-02-28');
      // March 31 minus 1 month in non-leap year clamps to Feb 28
      expect(subtractCalendarMonths('2026-03-31', 1)).toBe('2026-02-28');
      // August 31 minus 6 months in non-leap year clamps to Feb 28
      expect(subtractCalendarMonths('2026-08-31', 6)).toBe('2026-02-28');
      // October 31 minus 1 month clamps to September 30
      expect(subtractCalendarMonths('2026-10-31', 1)).toBe('2026-09-30');
    });

    it('correctly clamps to February 29 in a leap year', () => {
      // May 31, 2024 (leap year) minus 3 months resolves to Feb 29
      expect(subtractCalendarMonths('2024-05-31', 3)).toBe('2024-02-29');
      // March 31, 2024 minus 1 month resolves to Feb 29
      expect(subtractCalendarMonths('2024-03-31', 1)).toBe('2024-02-29');
      // August 31, 2024 minus 6 months resolves to Feb 29
      expect(subtractCalendarMonths('2024-08-31', 6)).toBe('2024-02-29');
    });

    it('correctly clamps to February 28 in a non-leap year', () => {
      expect(subtractCalendarMonths('2025-05-31', 3)).toBe('2025-02-28');
      expect(subtractCalendarMonths('2023-03-31', 1)).toBe('2023-02-28');
    });

    it('handles multi-month backward year transitions correctly', () => {
      // Jan 15, 2026 minus 2 months -> Nov 15, 2025
      expect(subtractCalendarMonths('2026-01-15', 2)).toBe('2025-11-15');
      // Jan 31, 2026 minus 2 months -> Nov 30, 2025 (clamped)
      expect(subtractCalendarMonths('2026-01-31', 2)).toBe('2025-11-30');
      // Feb 15, 2026 minus 6 months -> Aug 15, 2025
      expect(subtractCalendarMonths('2026-02-15', 6)).toBe('2025-08-15');
    });

    it('calculates normal dates without requiring day clamping', () => {
      // Nov 9 minus 3 months -> Aug 9
      expect(subtractCalendarMonths('2026-11-09', 3)).toBe('2026-08-09');
      // Nov 9 minus 6 months -> May 9
      expect(subtractCalendarMonths('2026-11-09', 6)).toBe('2026-05-09');
      // June 15 minus 3 months -> March 15
      expect(subtractCalendarMonths('2026-06-15', 3)).toBe('2026-03-15');
    });
  });

  describe('formatHoursAndMinutes', () => {
    it('formats round hours correctly', () => {
      expect(formatHoursAndMinutes(600)).toBe('10 hours');
      expect(formatHoursAndMinutes(420)).toBe('7 hours');
      expect(formatHoursAndMinutes(180)).toBe('3 hours');
      expect(formatHoursAndMinutes(60)).toBe('1 hour');
    });

    it('formats mixed hours and minutes correctly', () => {
      expect(formatHoursAndMinutes(90)).toBe('1 hour 30 mins');
      expect(formatHoursAndMinutes(125)).toBe('2 hours 5 mins');
      expect(formatHoursAndMinutes(61)).toBe('1 hour 1 min');
    });

    it('formats sub-hour durations correctly', () => {
      expect(formatHoursAndMinutes(45)).toBe('45 mins');
      expect(formatHoursAndMinutes(1)).toBe('1 min');
      expect(formatHoursAndMinutes(0)).toBe('0 hours');
      expect(formatHoursAndMinutes(-10)).toBe('0 hours');
    });
  });

  describe('formatDateRange', () => {
    it('formats date ranges within the same month', () => {
      const res = formatDateRange('2026-11-09', '2026-11-15');
      expect(res.includes('Nov 9') || res.includes('Nov')).toBe(true);
      expect(res.includes('15')).toBe(true);
      expect(res.includes('2026')).toBe(true);
    });

    it('handles invalid inputs gracefully', () => {
      expect(formatDateRange('', '')).toBe('-');
      expect(formatDateRange('invalid', 'dates')).toBe('invalid – dates');
    });
  });
});

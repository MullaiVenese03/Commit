import {
  CALENDAR_DATE_REGEX,
  extractNominalDate,
  getCalendarDaysDiff,
  getIsoWeekBounds,
  getTodayCalendarDate,
  isValidCalendarDate,
  shiftCalendarDate,
} from './date.util';

describe('Date Utility', () => {
  describe('CALENDAR_DATE_REGEX', () => {
    it('matches valid YYYY-MM-DD pattern', () => {
      expect(CALENDAR_DATE_REGEX.test('2026-11-09')).toBe(true);
      expect(CALENDAR_DATE_REGEX.test('2024-02-29')).toBe(true);
    });

    it('rejects invalid patterns', () => {
      expect(CALENDAR_DATE_REGEX.test('2026-1-9')).toBe(false);
      expect(CALENDAR_DATE_REGEX.test('2026/11/09')).toBe(false);
      expect(CALENDAR_DATE_REGEX.test('invalid')).toBe(false);
      expect(CALENDAR_DATE_REGEX.test('2026-13-01')).toBe(false);
      expect(CALENDAR_DATE_REGEX.test('2026-00-10')).toBe(false);
      expect(CALENDAR_DATE_REGEX.test('2026-11-32')).toBe(false);
    });
  });

  describe('isValidCalendarDate', () => {
    it('accepts regular valid dates', () => {
      expect(isValidCalendarDate('2026-11-09')).toBe(true);
      expect(isValidCalendarDate('2026-01-31')).toBe(true);
      expect(isValidCalendarDate('2026-04-30')).toBe(true);
      expect(isValidCalendarDate('2026-12-31')).toBe(true);
    });

    it('rejects invalid days in 30-day months', () => {
      expect(isValidCalendarDate('2026-04-31')).toBe(false);
      expect(isValidCalendarDate('2026-06-31')).toBe(false);
      expect(isValidCalendarDate('2026-09-31')).toBe(false);
      expect(isValidCalendarDate('2026-11-31')).toBe(false);
    });

    it('handles February in non-leap year (2026)', () => {
      expect(isValidCalendarDate('2026-02-28')).toBe(true);
      expect(isValidCalendarDate('2026-02-29')).toBe(false);
      expect(isValidCalendarDate('2026-02-30')).toBe(false);
    });

    it('handles February in leap year (2024)', () => {
      expect(isValidCalendarDate('2024-02-28')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true);
      expect(isValidCalendarDate('2024-02-30')).toBe(false);
    });

    it('rejects malformed, empty, or out-of-range dates', () => {
      expect(isValidCalendarDate('')).toBe(false);
      expect(isValidCalendarDate(null)).toBe(false);
      expect(isValidCalendarDate(undefined)).toBe(false);
      expect(isValidCalendarDate('not-a-date')).toBe(false);
      expect(isValidCalendarDate('1899-12-31')).toBe(false);
      expect(isValidCalendarDate('2101-01-01')).toBe(false);
    });
  });

  describe('shiftCalendarDate', () => {
    it('shifts days forward within the same month', () => {
      expect(shiftCalendarDate('2026-11-05', 4)).toBe('2026-11-09');
    });

    it('shifts days backward across month boundaries', () => {
      expect(shiftCalendarDate('2026-11-01', -1)).toBe('2026-10-31');
      expect(shiftCalendarDate('2026-05-01', -1)).toBe('2026-04-30');
    });

    it('shifts days backward across year boundaries', () => {
      expect(shiftCalendarDate('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('shifts days forward across year boundaries', () => {
      expect(shiftCalendarDate('2025-12-31', 1)).toBe('2026-01-01');
    });

    it('handles leap year shift in February correctly', () => {
      expect(shiftCalendarDate('2024-02-28', 1)).toBe('2024-02-29');
      expect(shiftCalendarDate('2024-02-29', 1)).toBe('2024-03-01');
      expect(shiftCalendarDate('2026-02-28', 1)).toBe('2026-03-01');
    });
  });

  describe('getCalendarDaysDiff', () => {
    it('returns 0 for identical dates', () => {
      expect(getCalendarDaysDiff('2026-11-09', '2026-11-09')).toBe(0);
    });

    it('returns positive count when later is ahead', () => {
      expect(getCalendarDaysDiff('2026-11-01', '2026-11-09')).toBe(8);
      expect(getCalendarDaysDiff('2025-12-31', '2026-01-01')).toBe(1);
    });

    it('calculates full year difference including leap year', () => {
      expect(getCalendarDaysDiff('2023-01-01', '2024-01-01')).toBe(365);
      expect(getCalendarDaysDiff('2024-01-01', '2025-01-01')).toBe(366);
    });
  });

  describe('extractNominalDate', () => {
    it('extracts YYYY-MM-DD from Date objects', () => {
      const date = new Date('2026-11-09T00:00:00.000Z');
      expect(extractNominalDate(date)).toBe('2026-11-09');
    });
  });

  describe('getTodayCalendarDate', () => {
    it('returns current UTC calendar date matching YYYY-MM-DD', () => {
      const today = getTodayCalendarDate();
      expect(CALENDAR_DATE_REGEX.test(today)).toBe(true);
    });
  });

  describe('getIsoWeekBounds', () => {
    it('computes Monday-to-Sunday bounds when date is Monday', () => {
      const { weekStart, weekEnd } = getIsoWeekBounds('2026-11-09');
      expect(weekStart).toBe('2026-11-09');
      expect(weekEnd).toBe('2026-11-15');
    });

    it('computes Monday-to-Sunday bounds when date is midweek Wednesday', () => {
      const { weekStart, weekEnd } = getIsoWeekBounds('2026-11-11');
      expect(weekStart).toBe('2026-11-09');
      expect(weekEnd).toBe('2026-11-15');
    });

    it('computes Monday-to-Sunday bounds when date is Sunday', () => {
      const { weekStart, weekEnd } = getIsoWeekBounds('2026-11-15');
      expect(weekStart).toBe('2026-11-09');
      expect(weekEnd).toBe('2026-11-15');
    });

    it('handles week boundaries across month and year transitions', () => {
      // 2026-01-01 is Thursday
      const { weekStart, weekEnd } = getIsoWeekBounds('2026-01-01');
      expect(weekStart).toBe('2025-12-29'); // Previous year's Monday
      expect(weekEnd).toBe('2026-01-04');   // Current year's Sunday
    });

    it('handles week boundaries in leap year February', () => {
      // 2024-02-29 is Thursday (Leap day)
      const { weekStart, weekEnd } = getIsoWeekBounds('2024-02-29');
      expect(weekStart).toBe('2024-02-26'); // Monday
      expect(weekEnd).toBe('2024-03-03');   // Sunday in March
    });
  });
});

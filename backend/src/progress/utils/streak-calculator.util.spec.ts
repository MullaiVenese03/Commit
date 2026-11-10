import {
  calculateActivityLevel,
  calculateStreakAndActivity,
  SessionRecord,
} from './streak-calculator.util';

describe('Streak & Activity Calculator Utility', () => {
  const TODAY = '2026-11-09';

  const makeSession = (dateStr: string, minutes: number): SessionRecord => ({
    studyDate: new Date(`${dateStr}T00:00:00.000Z`),
    minutes,
  });

  describe('calculateActivityLevel', () => {
    it('returns 0 for 0 or negative minutes', () => {
      expect(calculateActivityLevel(0)).toBe(0);
      expect(calculateActivityLevel(-10)).toBe(0);
    });

    it('returns 1 for 1 to 29 minutes', () => {
      expect(calculateActivityLevel(1)).toBe(1);
      expect(calculateActivityLevel(29)).toBe(1);
    });

    it('returns 2 for 30 to 59 minutes', () => {
      expect(calculateActivityLevel(30)).toBe(2);
      expect(calculateActivityLevel(59)).toBe(2);
    });

    it('returns 3 for 60 to 119 minutes', () => {
      expect(calculateActivityLevel(60)).toBe(3);
      expect(calculateActivityLevel(119)).toBe(3);
    });

    it('returns 4 for 120 or more minutes', () => {
      expect(calculateActivityLevel(120)).toBe(4);
      expect(calculateActivityLevel(300)).toBe(4);
    });
  });

  describe('Streak Calculation Rules', () => {
    it('returns zero streaks for empty history', () => {
      const { streaks, activity } = calculateStreakAndActivity([], TODAY);

      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(0);
      expect(streaks.totalActiveDays).toBe(0);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.isActiveYesterday).toBe(false);
      expect(streaks.referenceDate).toBe(TODAY);

      expect(activity.totalDays).toBe(365);
      expect(activity.activeDays).toBe(0);
      expect(activity.totalMinutes).toBe(0);
    });

    it('handles one active day today', () => {
      const sessions = [makeSession(TODAY, 45)];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(1);
      expect(streaks.longestStreak).toBe(1);
      expect(streaks.totalActiveDays).toBe(1);
      expect(streaks.isActiveToday).toBe(true);
      expect(streaks.isActiveYesterday).toBe(false);
    });

    it('handles one active day yesterday (today inactive - streak preserved)', () => {
      const sessions = [makeSession('2026-11-08', 60)];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(1);
      expect(streaks.longestStreak).toBe(1);
      expect(streaks.totalActiveDays).toBe(1);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.isActiveYesterday).toBe(true);
    });

    it('handles one active day two days ago (today & yesterday inactive - streak is zero)', () => {
      const sessions = [makeSession('2026-11-07', 60)];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(1);
      expect(streaks.totalActiveDays).toBe(1);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.isActiveYesterday).toBe(false);
    });

    it('calculates consecutive active days ending today', () => {
      const sessions = [
        makeSession('2026-11-06', 45),
        makeSession('2026-11-07', 30),
        makeSession('2026-11-08', 60),
        makeSession(TODAY, 90),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(4);
      expect(streaks.longestStreak).toBe(4);
      expect(streaks.totalActiveDays).toBe(4);
      expect(streaks.isActiveToday).toBe(true);
      expect(streaks.isActiveYesterday).toBe(true);
    });

    it('calculates consecutive active days ending yesterday when today is inactive', () => {
      const sessions = [
        makeSession('2026-11-05', 45),
        makeSession('2026-11-06', 30),
        makeSession('2026-11-07', 60),
        makeSession('2026-11-08', 90),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(4);
      expect(streaks.longestStreak).toBe(4);
      expect(streaks.totalActiveDays).toBe(4);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.isActiveYesterday).toBe(true);
    });

    it('resets current streak when gap exists between yesterday and older dates', () => {
      const sessions = [
        makeSession('2026-11-04', 60),
        makeSession('2026-11-05', 60),
        // Gap on Nov 6
        makeSession('2026-11-07', 60),
        makeSession('2026-11-08', 60),
        makeSession(TODAY, 60),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      // Current streak: Today (Nov 9), Yesterday (Nov 8), Nov 7 -> 3 days
      expect(streaks.currentStreak).toBe(3);
      // Longest streak: 3 days (Nov 7-9) vs 2 days (Nov 4-5) -> 3
      expect(streaks.longestStreak).toBe(3);
      expect(streaks.totalActiveDays).toBe(5);
    });

    it('calculates longest streak correctly across full history with intermittent periods', () => {
      const sessions = [
        // 5-day streak in October
        makeSession('2026-10-10', 30),
        makeSession('2026-10-11', 30),
        makeSession('2026-10-12', 30),
        makeSession('2026-10-13', 30),
        makeSession('2026-10-14', 30),
        // Gap
        // 2-day streak in November
        makeSession('2026-11-08', 45),
        makeSession(TODAY, 45),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(2);
      expect(streaks.longestStreak).toBe(5);
      expect(streaks.totalActiveDays).toBe(7);
    });

    it('handles month boundaries in streaks', () => {
      const sessions = [
        makeSession('2026-10-30', 60),
        makeSession('2026-10-31', 60),
        makeSession('2026-11-01', 60),
        makeSession('2026-11-02', 60),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, '2026-11-02');

      expect(streaks.currentStreak).toBe(4);
      expect(streaks.longestStreak).toBe(4);
    });

    it('handles year boundaries in streaks', () => {
      const sessions = [
        makeSession('2025-12-30', 60),
        makeSession('2025-12-31', 60),
        makeSession('2026-01-01', 60),
        makeSession('2026-01-02', 60),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, '2026-01-02');

      expect(streaks.currentStreak).toBe(4);
      expect(streaks.longestStreak).toBe(4);
    });

    it('handles leap year boundaries in February', () => {
      const sessions = [
        makeSession('2024-02-28', 60),
        makeSession('2024-02-29', 60),
        makeSession('2024-03-01', 60),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, '2024-03-01');

      expect(streaks.currentStreak).toBe(3);
      expect(streaks.longestStreak).toBe(3);
    });

    it('aggregates multiple sessions on the same calendar day into 1 active day with summed minutes', () => {
      const sessions = [
        makeSession(TODAY, 30),
        makeSession(TODAY, 45),
        makeSession(TODAY, 60),
      ];
      const { streaks, activity } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(1);
      expect(streaks.totalActiveDays).toBe(1);

      const todayRecord = activity.days.find((d) => d.date === TODAY);
      expect(todayRecord).toBeDefined();
      expect(todayRecord?.totalMinutes).toBe(135);
      expect(todayRecord?.sessionCount).toBe(3);
      expect(todayRecord?.level).toBe(4); // 135 mins >= 120 -> level 4
    });

    it('ignores sessions with zero or negative minutes', () => {
      const sessions = [
        makeSession(TODAY, 0),
        makeSession(TODAY, -15),
      ];
      const { streaks } = calculateStreakAndActivity(sessions, TODAY);

      expect(streaks.currentStreak).toBe(0);
      expect(streaks.totalActiveDays).toBe(0);
      expect(streaks.isActiveToday).toBe(false);
    });
  });

  describe('Historical Activity Aggregation & Bounded Heatmap', () => {
    it('returns exact 365-day trailing series by default', () => {
      const { activity } = calculateStreakAndActivity([], TODAY);

      expect(activity.days.length).toBe(365);
      expect(activity.endDate).toBe(TODAY);
      expect(activity.startDate).toBe('2025-11-10'); // 364 days prior to 2026-11-09
      expect(activity.days[0].date).toBe('2025-11-10');
      expect(activity.days[364].date).toBe(TODAY);
    });

    it('supports custom bounded date range', () => {
      const sessions = [
        makeSession('2026-11-01', 30),
        makeSession('2026-11-03', 90),
      ];
      const { activity } = calculateStreakAndActivity(sessions, TODAY, {
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      });

      expect(activity.days.length).toBe(5);
      expect(activity.startDate).toBe('2026-11-01');
      expect(activity.endDate).toBe('2026-11-05');
      expect(activity.totalDays).toBe(5);
      expect(activity.activeDays).toBe(2);
      expect(activity.totalMinutes).toBe(120);

      expect(activity.days[0]).toEqual({
        date: '2026-11-01',
        totalMinutes: 30,
        sessionCount: 1,
        level: 2,
      });

      // Zero-activity day included
      expect(activity.days[1]).toEqual({
        date: '2026-11-02',
        totalMinutes: 0,
        sessionCount: 0,
        level: 0,
      });

      expect(activity.days[2]).toEqual({
        date: '2026-11-03',
        totalMinutes: 90,
        sessionCount: 1,
        level: 3,
      });
    });
  });
});

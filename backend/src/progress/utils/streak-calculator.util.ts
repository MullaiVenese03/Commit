import {
  extractNominalDate,
  getCalendarDaysDiff,
  shiftCalendarDate,
} from './date.util';

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export interface DailyActivityRecord {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  level: ActivityLevel;
}

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  isActiveToday: boolean;
  isActiveYesterday: boolean;
  referenceDate: string;
}

export interface ActivityMetrics {
  startDate: string;
  endDate: string;
  totalDays: number;
  activeDays: number;
  totalMinutes: number;
  days: DailyActivityRecord[];
}

export interface SessionRecord {
  studyDate: Date;
  minutes: number;
}

/**
 * Calculates intensity level based on minutes studied on a given calendar day.
 */
export function calculateActivityLevel(totalMinutes: number): ActivityLevel {
  if (totalMinutes <= 0) return 0;
  if (totalMinutes < 30) return 1;
  if (totalMinutes < 60) return 2;
  if (totalMinutes < 120) return 3;
  return 4;
}

/**
 * Pure calculation utility for daily aggregation, streak metrics, and activity history.
 */
export function calculateStreakAndActivity(
  sessions: SessionRecord[],
  todayStr: string,
  range?: { startDate?: string; endDate?: string },
): {
  streaks: StreakMetrics;
  activity: ActivityMetrics;
} {
  // 1. Group all valid sessions by nominal calendar date (YYYY-MM-DD)
  const dailyMap = new Map<string, { totalMinutes: number; sessionCount: number }>();

  for (const session of sessions) {
    if (session.minutes <= 0) {
      continue; // Filter out zero or negative minutes
    }

    const dateStr = extractNominalDate(session.studyDate);
    const existing = dailyMap.get(dateStr);

    if (existing) {
      existing.totalMinutes += session.minutes;
      existing.sessionCount += 1;
    } else {
      dailyMap.set(dateStr, {
        totalMinutes: session.minutes,
        sessionCount: 1,
      });
    }
  }

  // 2. Total active days across full history
  const totalActiveDays = dailyMap.size;

  // 3. Current streak calculation
  const yesterdayStr = shiftCalendarDate(todayStr, -1);
  const isActiveToday = (dailyMap.get(todayStr)?.totalMinutes ?? 0) > 0;
  const isActiveYesterday = (dailyMap.get(yesterdayStr)?.totalMinutes ?? 0) > 0;

  let currentStreak = 0;
  if (isActiveToday) {
    currentStreak = 1;
    let checkDate = yesterdayStr;
    while ((dailyMap.get(checkDate)?.totalMinutes ?? 0) > 0) {
      currentStreak++;
      checkDate = shiftCalendarDate(checkDate, -1);
    }
  } else if (isActiveYesterday) {
    currentStreak = 1;
    let checkDate = shiftCalendarDate(yesterdayStr, -1);
    while ((dailyMap.get(checkDate)?.totalMinutes ?? 0) > 0) {
      currentStreak++;
      checkDate = shiftCalendarDate(checkDate, -1);
    }
  } else {
    currentStreak = 0;
  }

  // 4. Longest streak calculation across full available history
  const sortedActiveDates = Array.from(dailyMap.keys()).sort();
  let longestStreak = 0;

  if (sortedActiveDates.length > 0) {
    longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedActiveDates.length; i++) {
      const prevDate = sortedActiveDates[i - 1];
      const currDate = sortedActiveDates[i];
      const expectedNext = shiftCalendarDate(prevDate, 1);

      if (currDate === expectedNext) {
        currentRun++;
        if (currentRun > longestStreak) {
          longestStreak = currentRun;
        }
      } else {
        currentRun = 1;
      }
    }
  }

  const streaks: StreakMetrics = {
    currentStreak,
    longestStreak,
    totalActiveDays,
    isActiveToday,
    isActiveYesterday,
    referenceDate: todayStr,
  };

  // 5. Bounded Activity Heatmap calculation (default: trailing 365 days ending on todayStr)
  const endDate = range?.endDate ?? todayStr;
  const startDate = range?.startDate ?? shiftCalendarDate(endDate, -364);

  const daysCount = getCalendarDaysDiff(startDate, endDate) + 1;
  const days: DailyActivityRecord[] = [];
  let periodActiveDays = 0;
  let periodTotalMinutes = 0;

  let iterDate = startDate;
  for (let i = 0; i < daysCount; i++) {
    const data = dailyMap.get(iterDate);
    const totalMinutes = data?.totalMinutes ?? 0;
    const sessionCount = data?.sessionCount ?? 0;
    const level = calculateActivityLevel(totalMinutes);

    if (totalMinutes > 0) {
      periodActiveDays++;
      periodTotalMinutes += totalMinutes;
    }

    days.push({
      date: iterDate,
      totalMinutes,
      sessionCount,
      level,
    });

    iterDate = shiftCalendarDate(iterDate, 1);
  }

  const activity: ActivityMetrics = {
    startDate,
    endDate,
    totalDays: days.length,
    activeDays: periodActiveDays,
    totalMinutes: periodTotalMinutes,
    days,
  };

  return { streaks, activity };
}

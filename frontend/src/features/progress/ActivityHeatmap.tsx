import React, { useId, useMemo, useState } from 'react';
import { Clock, Flame, Info, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { DailyActivity } from '../../types';
import { formatMinutes, shiftCalendarDays, subtractCalendarMonths } from '../../utils/formatters';

export interface ActivityHeatmapProps {
  days: DailyActivity[];
  totalActiveDays?: number;
  totalMinutes?: number;
  isLoading?: boolean;
  className?: string;
  onSelectDate?: (activity: DailyActivity | null) => void;
}

type TimeRangeFilter = '3months' | '6months' | 'year';

const INTENSITY_COLORS: Record<
  number,
  { bg: string; border: string; text: string; label: string; hexBg: string; hexBorder: string }
> = {
  0: {
    bg: 'bg-[#F0EFEA]',
    border: 'border-[#E4E2DE]',
    text: 'text-[#777782]',
    label: 'No study activity',
    hexBg: '#F0EFEA',
    hexBorder: '#E4E2DE',
  },
  1: {
    bg: 'bg-[#DDDDF8]',
    border: 'border-[#C9C9F4]',
    text: 'text-[#5557C8]',
    label: 'Light study (< 30m)',
    hexBg: '#DDDDF8',
    hexBorder: '#C9C9F4',
  },
  2: {
    bg: 'bg-[#ACAEF0]',
    border: 'border-[#9396E8]',
    text: 'text-[#4446B4]',
    label: 'Moderate study (30m–59m)',
    hexBg: '#ACAEF0',
    hexBorder: '#9396E8',
  },
  3: {
    bg: 'bg-[#7375D8]',
    border: 'border-[#5557C8]',
    text: 'text-white',
    label: 'High study velocity (1h–2h)',
    hexBg: '#7375D8',
    hexBorder: '#5557C8',
  },
  4: {
    bg: 'bg-[#4446B4]',
    border: 'border-[#36389A]',
    text: 'text-white',
    label: 'Deep focus study (2h+)',
    hexBg: '#4446B4',
    hexBorder: '#36389A',
  },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  days,
  totalActiveDays,
  totalMinutes,
  isLoading = false,
  className = '',
  onSelectDate,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);
  const [rangeFilter, setRangeFilter] = useState<TimeRangeFilter>('year');
  const gridId = useId();

  // Canonical activity map: maps date string to DailyActivity with verified numeric level
  const activityMap = useMemo(() => {
    const map = new Map<string, DailyActivity>();
    if (!days) return map;
    for (const d of days) {
      if (d && d.date) {
        // Resolve intensity level using canonical `level`, legacy `intensityLevel`, or threshold calculation
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        const legacyIntensity = (d as unknown as { intensityLevel?: unknown }).intensityLevel;
        if (typeof d.level === 'number' && d.level >= 0 && d.level <= 4) {
          level = d.level;
        } else if (
          typeof legacyIntensity === 'number' &&
          legacyIntensity >= 0 &&
          legacyIntensity <= 4
        ) {
          level = legacyIntensity as 0 | 1 | 2 | 3 | 4;
        } else if (d.totalMinutes > 0) {
          if (d.totalMinutes < 30) level = 1;
          else if (d.totalMinutes < 60) level = 2;
          else if (d.totalMinutes < 120) level = 3;
          else level = 4;
        }

        map.set(d.date, {
          date: d.date,
          sessionCount: d.sessionCount ?? 0,
          totalMinutes: d.totalMinutes ?? 0,
          level,
        });
      }
    }
    return map;
  }, [days]);

  // Filter days based on chosen time range and ensure continuous date sequence
  const filteredDays = useMemo(() => {
    if (!days || days.length === 0) return [];

    let startStr: string;
    const lastDay = days[days.length - 1];
    const endStr = lastDay.date;

    if (rangeFilter === 'year') {
      if (days.length >= 365) {
        startStr = days[days.length - 365].date;
      } else {
        startStr = days[0].date;
      }
    } else {
      const monthsToSubtract = rangeFilter === '3months' ? 3 : 6;
      startStr = subtractCalendarMonths(endStr, monthsToSubtract);
      if (days[0].date > startStr) {
        startStr = days[0].date;
      }
    }

    // Generate continuous list of dates from startStr to endStr to guarantee weekday alignment
    const result: DailyActivity[] = [];
    let iter = startStr;
    while (iter <= endStr) {
      const record = activityMap.get(iter) ?? {
        date: iter,
        totalMinutes: 0,
        sessionCount: 0,
        level: 0,
      };
      result.push(record);
      iter = shiftCalendarDays(iter, 1);
    }

    return result;
  }, [days, rangeFilter, activityMap]);

  // Transform flat array of days into weekly columns (Monday = row 0, Sunday = row 6)
  const { columns, monthLabels } = useMemo(() => {
    if (filteredDays.length === 0) {
      return { columns: [], monthLabels: [] };
    }

    const cols: Array<Array<DailyActivity | null>> = [];
    let currentWeek: Array<DailyActivity | null> = new Array(7).fill(null);

    // Determine the ISO day index of the first date
    const firstDateStr = filteredDays[0].date;
    const [y, m, d] = firstDateStr.split('-').map(Number);
    const firstUtc = new Date(Date.UTC(y, m - 1, d));
    const firstIsoDay = (firstUtc.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6

    let currentDayIndex = firstIsoDay;

    for (const day of filteredDays) {
      currentWeek[currentDayIndex] = day;

      if (currentDayIndex === 6) {
        // Sunday reached, finish column
        cols.push(currentWeek);
        currentWeek = new Array(7).fill(null);
        currentDayIndex = 0;
      } else {
        currentDayIndex++;
      }
    }

    // Push trailing week if incomplete
    if (currentDayIndex > 0) {
      cols.push(currentWeek);
    }

    // Calculate month labels placed over the columns where months start
    const months: Array<{ label: string; colIndex: number }> = [];
    let lastMonth = -1;

    cols.forEach((col, colIdx) => {
      // Find the first non-null day in this week
      const firstValidDay = col.find((d) => d !== null);
      if (firstValidDay) {
        const monthNum = parseInt(firstValidDay.date.split('-')[1], 10);
        if (monthNum !== lastMonth) {
          const dateObj = new Date(firstValidDay.date + 'T00:00:00Z');
          const monthShort = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            timeZone: 'UTC',
          });
          months.push({ label: monthShort, colIndex: colIdx });
          lastMonth = monthNum;
        }
      }
    });

    return { columns: cols, monthLabels: months };
  }, [filteredDays]);

  const handleCellClick = (activity: DailyActivity) => {
    const nextSelected = selectedActivity?.date === activity.date ? null : activity;
    setSelectedActivity(nextSelected);
    if (onSelectDate) {
      onSelectDate(nextSelected);
    }
  };

  const handleClearSelection = () => {
    setSelectedActivity(null);
    if (onSelectDate) {
      onSelectDate(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, activity: DailyActivity) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(activity);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs ${className}`}>
        <div className="h-4 bg-[#E4E2DE] rounded w-48 mb-4 animate-pulse" />
        <div className="h-32 bg-[#F8F7F4] rounded-lg animate-pulse" />
      </div>
    );
  }

  const activeDaysCount = totalActiveDays ?? days.filter((d) => d.sessionCount > 0).length;
  const totalMinsCalculated = totalMinutes ?? days.reduce((sum, d) => sum + d.totalMinutes, 0);

  return (
    <div
      className={`bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs space-y-4 ${className}`}
      data-testid="activity-heatmap"
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E2DE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#24242A] uppercase tracking-wider select-none">
              Study Activity Heatmap
            </span>
            <Badge variant="neutral" size="sm" className="tabular-nums">
              {activeDaysCount} active days
            </Badge>
          </div>
          <p className="text-xs text-[#777782] mt-0.5">
            Daily verified study intensity over the selected calendar window ({formatMinutes(totalMinsCalculated)} total).
          </p>
        </div>

        {/* Range Selector Buttons */}
        <div className="inline-flex p-1 bg-[#ECEBE7] rounded-xl border border-[#E4E2DE] text-xs font-medium self-start sm:self-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setRangeFilter('3months')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              rangeFilter === '3months'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            3 Months
          </button>
          <button
            type="button"
            onClick={() => setRangeFilter('6months')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              rangeFilter === '6months'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setRangeFilter('year')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              rangeFilter === 'year'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            Past Year
          </button>
        </div>
      </div>

      {/* Grid Container with Horizontal Scroll Support */}
      <div className="overflow-x-auto pb-2 focus:outline-hidden" tabIndex={0} aria-label="Study activity grid scroll container">
        <div className="inline-block min-w-full">
          {/* Month Header Row */}
          <div className="flex text-[10px] text-[#777782] font-semibold select-none mb-1.5 pl-7">
            {columns.map((_, colIdx) => {
              const month = monthLabels.find((m) => m.colIndex === colIdx);
              return (
                <div key={colIdx} className="w-[14px] mr-[3px] text-left shrink-0">
                  {month ? <span>{month.label}</span> : null}
                </div>
              );
            })}
          </div>

          {/* Matrix: Days of Week + Grid Cells */}
          <div className="flex items-start" role="grid" aria-label="Study activity heatmap by date" id={gridId}>
            {/* Day of Week Labels (Left Column) */}
            <div className="flex flex-col gap-[3px] pr-2 text-[10px] text-[#777782] font-medium select-none shrink-0" aria-hidden="true">
              {DAY_LABELS.map((dayLabel, idx) => (
                <div key={dayLabel} className="h-[14px] flex items-center justify-end w-5 leading-none">
                  {idx % 2 === 0 ? dayLabel : ''}
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3px] shrink-0">
              {columns.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px] shrink-0" role="row">
                  {week.map((day, rowIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${rowIdx}`}
                          className="w-[14px] h-[14px] rounded-[3px] bg-transparent opacity-0 pointer-events-none"
                          aria-hidden="true"
                        />
                      );
                    }

                    const isSelected = selectedActivity?.date === day.date;
                    const cellLevel = day.level;
                    const intensity = INTENSITY_COLORS[cellLevel] || INTENSITY_COLORS[0];
                    const accessibleDate = formatDateDisplay(day.date);
                    const accessibleLabel = `${accessibleDate}: ${day.totalMinutes} minutes across ${day.sessionCount} sessions (${intensity.label})`;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        role="gridcell"
                        aria-selected={isSelected}
                        aria-label={accessibleLabel}
                        tabIndex={0}
                        onClick={() => handleCellClick(day)}
                        onKeyDown={(e) => handleKeyDown(e, day)}
                        data-testid="heatmap-cell"
                        data-date={day.date}
                        data-level={cellLevel}
                        data-minutes={day.totalMinutes}
                        style={{
                          backgroundColor: intensity.hexBg,
                          borderColor: intensity.hexBorder,
                        }}
                        className={`w-[14px] h-[14px] rounded-[3px] border transition-all duration-100 cursor-pointer ${
                          intensity.bg
                        } ${intensity.border} ${
                          isSelected
                            ? 'ring-2 ring-[#5557C8] ring-offset-1 z-10 scale-125'
                            : 'hover:scale-125 hover:z-10'
                        }`}
                        title={accessibleLabel}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E4E2DE] text-xs text-[#777782]">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#777782] shrink-0" />
          <span>Click any cell to inspect detailed study session metrics for that date.</span>
        </div>

        {/* Visual Color Legend */}
        <div className="flex items-center gap-1.5 select-none shrink-0" aria-label="Activity intensity scale">
          <span className="text-[11px] text-[#777782] font-medium mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((level) => {
            const style = INTENSITY_COLORS[level];
            return (
              <span
                key={level}
                data-testid={`legend-level-${level}`}
                style={{
                  backgroundColor: style.hexBg,
                  borderColor: style.hexBorder,
                }}
                className={`w-3.5 h-3.5 rounded-[2px] border ${style.bg} ${style.border}`}
                title={style.label}
                aria-label={style.label}
              />
            );
          })}
          <span className="text-[11px] text-[#777782] font-medium ml-1">More</span>
        </div>
      </div>

      {/* Active Selection Details Card */}
      {selectedActivity && (() => {
        const selectedRecord = activityMap.get(selectedActivity.date) ?? selectedActivity;
        const selectedLevel = selectedRecord.level;
        const selectedStyle = INTENSITY_COLORS[selectedLevel] || INTENSITY_COLORS[0];

        return (
          <div
            className="mt-3 p-4 bg-[#F8F7F4] rounded-xl border border-[#5557C8]/30 shadow-xs transition-all"
            data-testid="heatmap-date-detail"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#24242A]">
                    {formatDateDisplay(selectedRecord.date)}
                  </span>
                  <Badge
                    variant={selectedRecord.totalMinutes > 0 ? 'success' : 'neutral'}
                    size="sm"
                    className={
                      selectedRecord.totalMinutes > 0
                        ? 'bg-[#278568]/12 text-[#278568] border-[#278568]/25'
                        : ''
                    }
                  >
                    {selectedStyle.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#777782] block font-medium">Total Study Time</span>
                    <span className="text-base font-bold text-[#24242A] tabular-nums flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#5557C8]" />
                      {selectedRecord.totalMinutes > 0
                        ? formatMinutes(selectedRecord.totalMinutes)
                        : '0 minutes'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#777782] block font-medium">Study Sessions</span>
                    <span className="text-base font-bold text-[#24242A] tabular-nums flex items-center gap-1.5 mt-0.5">
                      <Flame className="w-3.5 h-3.5 text-[#B98237]" />
                      {selectedRecord.sessionCount === 1
                        ? '1 session'
                        : `${selectedRecord.sessionCount} sessions`}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-[#777782] block font-medium">Intensity Rating</span>
                    <span className="text-base font-bold text-[#24242A] tabular-nums mt-0.5 block" data-testid="selected-date-intensity">
                      Level {selectedLevel} / 4
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-[#777782] hover:text-[#24242A] h-7 w-7 p-0 shrink-0"
                aria-label="Close date details"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

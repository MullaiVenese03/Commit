import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar, Clock } from 'lucide-react';
import type { StudySession } from '../../types';
import { formatMinutes } from '../../utils/formatters';

interface WeeklyActivityChartProps {
  sessions: StudySession[];
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ sessions }) => {
  // Compute the last 7 consecutive days up to today
  const { daysData, dateRangeLabel } = React.useMemo(() => {
    const today = new Date();
    const result: Array<{
      dateKey: string;
      label: string;
      fullDate: string;
      minutes: number;
    }> = [];

    let earliestDate = '';
    let latestDate = '';

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const formattedMonthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (i === 6) earliestDate = formattedMonthDay;
      if (i === 0) latestDate = formattedMonthDay;

      // Sum minutes studied on this specific day from actual sessions
      const dayMinutes = sessions
        .filter((s) => s.studyDate && s.studyDate.startsWith(dateKey))
        .reduce((sum, s) => sum + s.minutes, 0);

      result.push({
        dateKey,
        label: `${weekday} ${dayNum}`,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        minutes: dayMinutes,
      });
    }

    return {
      daysData: result,
      dateRangeLabel: `${earliestDate} – ${latestDate}`,
    };
  }, [sessions]);

  const totalWeeklyMinutes = daysData.reduce((acc, curr) => acc + curr.minutes, 0);
  const maxDailyMinutes = Math.max(...daysData.map((d) => d.minutes), 60);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#777782] uppercase tracking-wider block select-none">
              Weekly Activity
            </span>
            <span className="text-[#E4E2DE]">•</span>
            <span className="text-[11px] text-[#777782] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#777782]" />
              <span>{dateRangeLabel}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-[#24242A] tracking-tight tabular-nums">
              {formatMinutes(totalWeeklyMinutes)}
            </span>
            <span className="text-xs text-[#777782] font-medium">recorded in past 7 days</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#777782] bg-[#F8F7F4] border border-[#E4E2DE] px-2.5 py-1 rounded-lg self-start sm:self-auto select-none">
          <Clock className="w-3.5 h-3.5 text-[#777782] shrink-0" />
          <span>Daily Avg: <strong className="text-[#24242A]">{formatMinutes(Math.round(totalWeeklyMinutes / 7))}</strong></span>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        {totalWeeklyMinutes === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-[#F8F7F4] rounded-xl border border-dashed border-[#E4E2DE]">
            <Clock className="w-5 h-5 text-[#777782] mb-1" />
            <p className="text-xs font-medium text-[#24242A]">No study time recorded in the past 7 days</p>
            <p className="text-[11px] text-[#777782] mt-0.5">Log a study session to begin building your consistency graph</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daysData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#777782' }}
                axisLine={{ stroke: '#E4E2DE' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.ceil(maxDailyMinutes / 30) * 30]}
                tick={{ fontSize: 10, fill: '#777782' }}
                tickFormatter={(val) => `${val}m`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: unknown) => [
                  `${typeof value === 'number' ? value : 0} minutes`,
                  'Focused Study',
                ]}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.fullDate || ''
                }
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #E4E2DE',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  padding: '8px 12px',
                  color: '#24242A',
                }}
              />
              <Bar
                dataKey="minutes"
                fill="#5557C8"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

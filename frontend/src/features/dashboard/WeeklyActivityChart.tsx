import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock } from 'lucide-react';
import type { StudySession } from '../../types';
import { formatMinutes } from '../../utils/formatters';

interface WeeklyActivityChartProps {
  sessions: StudySession[];
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ sessions }) => {
  // Compute the last 7 consecutive days up to today
  const daysData = React.useMemo(() => {
    const today = new Date();
    const result: Array<{
      dateKey: string;
      label: string;
      fullDate: string;
      minutes: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      // Sum minutes studied on this specific day
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

    return result;
  }, [sessions]);

  const totalWeeklyMinutes = daysData.reduce((acc, curr) => acc + curr.minutes, 0);
  const maxDailyMinutes = Math.max(...daysData.map((d) => d.minutes), 60);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Weekly Activity
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {formatMinutes(totalWeeklyMinutes)}
            </span>
            <span className="text-xs text-zinc-500 font-medium">studied in past 7 days</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/80 px-2 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Daily Avg: {formatMinutes(Math.round(totalWeeklyMinutes / 7))}</span>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        {totalWeeklyMinutes === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-zinc-50/50 rounded-md border border-dashed border-zinc-200">
            <Clock className="w-5 h-5 text-zinc-300 mb-1" />
            <p className="text-xs font-medium text-zinc-600">No study time recorded in the past 7 days</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Log a study session to begin building your consistency graph</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daysData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={{ stroke: '#e4e4e7' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.ceil(maxDailyMinutes / 30) * 30]}
                tick={{ fontSize: 10, fill: '#71717a' }}
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
                  borderRadius: '6px',
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  padding: '6px 10px',
                }}
              />
              <Bar
                dataKey="minutes"
                fill="#2563eb"
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

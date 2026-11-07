import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import type { GoalProgressSummary, ProgressOverview } from '../../types';

interface ProgressChartsProps {
  overview: ProgressOverview;
  goals: GoalProgressSummary[];
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  overview,
  goals,
}) => {
  // Goal Progress Chart Data
  const goalChartData = goals.map((g) => ({
    name: g.title.length > 18 ? `${g.title.slice(0, 16)}...` : g.title,
    fullName: g.title,
    progress: g.progressPercentage,
    completed: g.completedTopics,
    total: g.totalTopics,
  }));

  // Topic Completion Status Pie Data
  const pieData = [
    { name: 'Completed Topics', value: overview.completedTopics, color: '#10b981' },
    { name: 'Remaining Topics', value: overview.remainingTopics, color: '#e4e4e7' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart: Progress per Goal */}
      <Card
        title="Curriculum Completion by Goal"
        subtitle="Individual milestone progress percentage for each active curriculum"
        className="lg:col-span-2"
      >
        {goals.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-zinc-400">
            No curriculum goals available for visual comparison.
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={goalChartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickFormatter={(val) => `${val}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, item: unknown) => {
                    const payload = (item as { payload?: { completed?: number; total?: number } })?.payload;
                    return [
                      `${typeof value === 'number' ? value : 0}% (${payload?.completed ?? 0}/${payload?.total ?? 0} topics)`,
                      'Completion',
                    ];
                  }}
                  labelFormatter={(_label, payload) =>
                    (payload?.[0]?.payload as { fullName?: string })?.fullName || ''
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
                <Bar dataKey="progress" fill="#2563eb" radius={[4, 4, 0, 0]}>
                  {goalChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.progress === 100 ? '#10b981' : '#2563eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Pie Chart: Overall Topic Breakdown */}
      <Card
        title="Topic Completion Distribution"
        subtitle="Completed milestones vs remaining prerequisites"
      >
        {overview.totalTopics === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-zinc-400">
            No topic milestones defined yet.
          </div>
        ) : (
          <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    `${typeof val === 'number' ? val : 0} topics`,
                    typeof name === 'string' ? name : 'Milestones',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    padding: '6px 10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 text-xs font-medium text-zinc-600 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Completed ({overview.completedTopics})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                <span>Remaining ({overview.remainingTopics})</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

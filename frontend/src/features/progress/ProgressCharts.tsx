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
    name: g.title.length > 20 ? `${g.title.slice(0, 18)}...` : g.title,
    fullName: g.title,
    progress: g.progressPercentage,
    completed: g.completedTopics,
    total: g.totalTopics,
  }));

  // Topic Completion Status Pie Data
  const pieData = [
    { name: 'Completed Topics', value: overview.completedTopics, color: '#278568' },
    { name: 'Remaining Topics', value: overview.remainingTopics, color: '#E4E2DE' },
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
          <div className="h-64 flex flex-col items-center justify-center text-xs text-[#777782]">
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
                  tick={{ fontSize: 11, fill: '#777782' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={{ stroke: '#E4E2DE' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#777782' }}
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
                    borderRadius: '12px',
                    border: '1px solid #E4E2DE',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                    color: '#24242A',
                  }}
                />
                <Bar dataKey="progress" fill="#5557C8" radius={[4, 4, 0, 0]}>
                  {goalChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.progress === 100 ? '#278568' : '#5557C8'}
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
          <div className="h-64 flex flex-col items-center justify-center text-xs text-[#777782]">
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
                  innerRadius={50}
                  outerRadius={74}
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
                    borderRadius: '12px',
                    border: '1px solid #E4E2DE',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                    color: '#24242A',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 text-xs font-medium text-[#777782] mt-2 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#278568]" />
                <span>Completed ({overview.completedTopics})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4E2DE]" />
                <span>Remaining ({overview.remainingTopics})</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

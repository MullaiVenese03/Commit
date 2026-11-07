import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { useMyProgress } from '../../hooks/useProgress';
import { formatMinutes } from '../../utils/formatters';
import { StatCard } from '../dashboard/StatCard';
import { SessionTable } from '../sessions/SessionTable';
import { ProgressCharts } from './ProgressCharts';

export const ProgressPage: React.FC = () => {
  const { data: progress, isLoading, error } = useMyProgress();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-zinc-600" />
        <p className="text-xs text-zinc-500 mt-3 font-medium">
          Loading learning analytics...
        </p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
        Failed to load progress metrics. Please try refreshing the page.
      </div>
    );
  }

  const { overview, goals, recentSessions } = progress;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-zinc-200/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
          Academic Analytics
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
          Progress & Analytics
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Quantitative breakdowns of milestone completion ratios, study duration, and curriculum progress.
        </p>
      </div>

      {/* Top Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Curricula Tracked"
          value={overview.totalGoals}
          subtitle={`${goals.length} active curricula`}
          icon={<Compass className="w-4 h-4 text-zinc-600" />}
          iconBgColor="bg-zinc-100"
        />

        <StatCard
          title="Milestones Completed"
          value={`${overview.completedTopics} / ${overview.totalTopics}`}
          subtitle={`${overview.remainingTopics} milestones pending`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Mastery Ratio"
          value={`${overview.completionPercentage}%`}
          subtitle="Cumulative milestone completion"
          icon={<Flame className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50"
          variant="highlight"
        />

        <StatCard
          title="Focused Study Time"
          value={formatMinutes(overview.totalMinutes)}
          subtitle={`${overview.totalHours} total study hours`}
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />
      </div>

      {/* Recharts Visualizations */}
      <ProgressCharts overview={overview} goals={goals} />

      {/* Goal Completion Breakdown Table */}
      <Card
        title="Curriculum Progress Breakdown"
        subtitle="Individual milestone completion percentages by study curriculum"
      >
        {goals.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No curricula defined yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Curriculum Goal</th>
                  <th scope="col" className="px-4 py-3">Completed Milestones</th>
                  <th scope="col" className="px-4 py-3 w-1/3">Mastery Progress</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {goals.map((g) => {
                  const isMastered = g.progressPercentage === 100 && g.totalTopics > 0;
                  return (
                    <tr key={g.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        <Link to={`/goals/${g.id}`} className="hover:text-blue-600 transition truncate block max-w-xs">
                          {g.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                        {g.completedTopics} of {g.totalTopics} topics
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar value={g.progressPercentage} showValue size="sm" variant={isMastered ? 'success' : 'default'} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isMastered ? (
                          <Badge variant="success" size="sm">Mastered</Badge>
                        ) : g.progressPercentage > 0 ? (
                          <Badge variant="accent" size="sm">In Progress</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Not Started</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/goals/${g.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                        >
                          <span>Curriculum</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Recent Study Sessions
          </h2>
          <Link
            to="/sessions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>Full Session Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <SessionTable sessions={recentSessions} isReadOnly />
      </div>
    </div>
  );
};

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
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
        <Spinner size="lg" className="text-[#5557C8]" />
        <p className="text-xs text-[#777782] mt-3 font-medium">
          Loading learning analytics...
        </p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
        Failed to load progress metrics. Please try refreshing the page.
      </div>
    );
  }

  const { overview, goals, recentSessions } = progress;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-[#E4E2DE]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
          Academic Analytics
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
          Progress & Analytics
        </h1>
        <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
          Quantitative breakdowns of milestone completion ratios, study duration, and curriculum progress.
        </p>
      </div>

      {/* Top Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Curricula Tracked"
          value={overview.totalGoals}
          subtitle={`${goals.length} active curricula`}
          icon={<Compass className="w-4 h-4 text-[#777782]" />}
          iconBgColor="bg-[#F8F7F4] border border-[#E4E2DE]"
        />

        <StatCard
          title="Milestones Completed"
          value={`${overview.completedTopics} / ${overview.totalTopics}`}
          subtitle={`${overview.remainingTopics} milestones pending`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#278568]" />}
          iconBgColor="bg-[#278568]/12 border border-[#278568]/25"
        />

        <StatCard
          title="Mastery Ratio"
          value={`${overview.completionPercentage}%`}
          subtitle="Cumulative milestone completion"
          icon={<Flame className="w-4 h-4 text-[#B98237]" />}
          iconBgColor="bg-[#B98237]/10 border border-[#B98237]/25"
          variant="highlight"
        />

        <StatCard
          title="Focused Study Time"
          value={formatMinutes(overview.totalMinutes)}
          subtitle={`${overview.totalHours} total study hours`}
          icon={<Clock className="w-4 h-4 text-[#5557C8]" />}
          iconBgColor="bg-[#EEEEFC] border border-[#5557C8]/25"
        />
      </div>

      {/* Recharts Visualizations */}
      <ProgressCharts overview={overview} goals={goals} />

      {/* Goal Completion Breakdown Table / Responsive Cards */}
      <Card
        title="Curriculum Progress Breakdown"
        subtitle="Individual milestone completion percentages by study curriculum"
      >
        {goals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777782]">
            No curricula defined yet.
          </div>
        ) : (
          <div>
            {/* Desktop / Tablet Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-[#24242A]">
                <thead className="bg-[#F8F7F4] border-b border-[#E4E2DE] text-[10px] uppercase font-bold text-[#777782] tracking-wider select-none">
                  <tr>
                    <th scope="col" className="px-4 py-3">Curriculum Goal</th>
                    <th scope="col" className="px-4 py-3">Completed Milestones</th>
                    <th scope="col" className="px-4 py-3 w-1/3">Mastery Progress</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E2DE]/70">
                  {goals.map((g) => {
                    const isMastered = g.progressPercentage === 100 && g.totalTopics > 0;
                    return (
                      <tr key={g.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-[#24242A]">
                          <Link to={`/goals/${g.id}`} className="hover:text-[#5557C8] transition truncate block max-w-xs">
                            {g.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-[#777782] whitespace-nowrap tabular-nums">
                          {g.completedTopics} of {g.totalTopics} topics
                        </td>
                        <td className="px-4 py-3.5">
                          <ProgressBar value={g.progressPercentage} showValue size="sm" variant={isMastered ? 'success' : 'default'} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isMastered ? (
                            <Badge variant="success" size="sm">Mastered</Badge>
                          ) : g.progressPercentage > 0 ? (
                            <Badge variant="accent" size="sm">In Progress</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Not Started</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Link
                            to={`/goals/${g.id}`}
                            className="text-xs font-semibold text-[#5557C8] hover:text-[#4446B4] inline-flex items-center gap-1"
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

            {/* Mobile Card List */}
            <div className="sm:hidden space-y-3">
              {goals.map((g) => {
                const isMastered = g.progressPercentage === 100 && g.totalTopics > 0;
                return (
                  <div key={g.id} className="p-3.5 rounded-xl border border-[#E4E2DE] bg-[#F8F7F4] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/goals/${g.id}`} className="font-semibold text-xs text-[#24242A] hover:text-[#5557C8]">
                        {g.title}
                      </Link>
                      {isMastered ? (
                        <Badge variant="success" size="sm">Mastered</Badge>
                      ) : g.progressPercentage > 0 ? (
                        <Badge variant="accent" size="sm">In Progress</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Not Started</Badge>
                      )}
                    </div>
                    <ProgressBar value={g.progressPercentage} showValue size="sm" variant={isMastered ? 'success' : 'default'} />
                    <div className="flex items-center justify-between text-[11px] text-[#777782] pt-1">
                      <span>{g.completedTopics} of {g.totalTopics} topics</span>
                      <Link to={`/goals/${g.id}`} className="text-[#5557C8] font-semibold flex items-center gap-1">
                        <span>Curriculum</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#24242A] uppercase tracking-wider select-none">
            Recent Study Sessions
          </h2>
          <Link
            to="/sessions"
            className="text-xs font-semibold text-[#5557C8] hover:text-[#4446B4] flex items-center gap-1 transition"
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

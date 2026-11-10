import React from 'react';
import { Calendar, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import type { StreakMetrics } from '../../types';
import { formatMinutes } from '../../utils/formatters';
import { StatCard } from '../dashboard/StatCard';

export interface StreakSummaryProps {
  streaks: StreakMetrics | null | undefined;
  totalStudyMinutes?: number;
  isLoading?: boolean;
  className?: string;
}

export const StreakSummary: React.FC<StreakSummaryProps> = ({
  streaks,
  totalStudyMinutes,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#E4E2DE] p-4 sm:p-5 h-28 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3 bg-[#E4E2DE] rounded w-24" />
            <div className="h-7 bg-[#E4E2DE] rounded w-16" />
            <div className="h-3 bg-[#E4E2DE] rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const currentStreak = streaks?.currentStreak ?? 0;
  const longestStreak = streaks?.longestStreak ?? 0;
  const totalActiveDays = streaks?.totalActiveDays ?? 0;
  const isActiveToday = streaks?.isActiveToday ?? false;
  const isActiveYesterday = streaks?.isActiveYesterday ?? false;

  const getStreakStatusBadge = () => {
    if (currentStreak === 0) {
      return (
        <Badge variant="neutral" size="sm">
          Inactive
        </Badge>
      );
    }
    if (isActiveToday) {
      return (
        <Badge variant="success" size="sm" className="bg-[#278568]/12 text-[#278568] border-[#278568]/25">
          Active Today
        </Badge>
      );
    }
    if (isActiveYesterday) {
      return (
        <Badge variant="warning" size="sm" className="bg-[#B98237]/12 text-[#B98237] border-[#B98237]/25">
          At Risk
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        Preserved
      </Badge>
    );
  };

  const getStreakSubtitle = () => {
    if (currentStreak === 0) {
      return 'Log a study session today to start';
    }
    if (isActiveToday) {
      return 'Daily study goal achieved today';
    }
    if (isActiveYesterday) {
      return 'Log study today to keep streak alive';
    }
    return `${currentStreak} consecutive active days`;
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`} data-testid="streak-summary">
      <StatCard
        title="Current Streak"
        value={currentStreak === 1 ? '1 day' : `${currentStreak} days`}
        subtitle={getStreakSubtitle()}
        badge={getStreakStatusBadge()}
        icon={<Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-[#B98237]' : 'text-[#777782]'}`} />}
        iconBgColor={currentStreak > 0 ? 'bg-[#B98237]/10 border border-[#B98237]/25' : 'bg-[#F8F7F4] border border-[#E4E2DE]'}
        variant={currentStreak > 0 ? 'highlight' : 'default'}
      />

      <StatCard
        title="Longest Streak"
        value={longestStreak === 1 ? '1 day' : `${longestStreak} days`}
        subtitle="All-time personal record"
        icon={<Trophy className="w-4 h-4 text-[#5557C8]" />}
        iconBgColor="bg-[#EEEEFC] border border-[#5557C8]/25"
      />

      <StatCard
        title="Active Study Days"
        value={`${totalActiveDays} days`}
        subtitle="Cumulative active days"
        icon={<CheckCircle2 className="w-4 h-4 text-[#278568]" />}
        iconBgColor="bg-[#278568]/12 border border-[#278568]/25"
      />

      <StatCard
        title="Study Time"
        value={totalStudyMinutes !== undefined ? formatMinutes(totalStudyMinutes) : '—'}
        subtitle="Recorded in the past 365 days"
        icon={<Calendar className="w-4 h-4 text-[#777782]" />}
        iconBgColor="bg-[#F8F7F4] border border-[#E4E2DE]"
      />
    </div>
  );
};

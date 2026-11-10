import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  useLearnerActivity,
  useLearnerStreaks,
  useMyActivity,
  useMyStreaks,
} from '../../hooks/useProgress';
import { getErrorMessage } from '../../utils/formatters';
import { ActivityHeatmap } from './ActivityHeatmap';
import { StreakSummary } from './StreakSummary';

export interface StudyActivitySectionProps {
  learnerId?: string;
  className?: string;
  isReadOnly?: boolean;
}

export const StudyActivitySection: React.FC<StudyActivitySectionProps> = ({
  learnerId,
  className = '',
  isReadOnly = false,
}) => {
  // If learnerId is provided, query mentor-scoped endpoints; otherwise query current user
  const myStreaksQuery = useMyStreaks();
  const learnerStreaksQuery = useLearnerStreaks(learnerId || '');
  const streaksQuery = learnerId ? learnerStreaksQuery : myStreaksQuery;

  const myActivityQuery = useMyActivity();
  const learnerActivityQuery = useLearnerActivity(learnerId || '');
  const activityQuery = learnerId ? learnerActivityQuery : myActivityQuery;

  const isLoading = streaksQuery.isLoading || activityQuery.isLoading;
  const isError = streaksQuery.isError || activityQuery.isError;
  const error = streaksQuery.error || activityQuery.error;

  const handleRefetch = () => {
    streaksQuery.refetch();
    activityQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="study-activity-loading">
        <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DE]">
          <div className="h-4 bg-[#E4E2DE] rounded w-48 animate-pulse" />
        </div>
        <StreakSummary streaks={null} isLoading />
        <ActivityHeatmap days={[]} isLoading />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs space-y-3 ${className}`}
        data-testid="study-activity-error"
      >
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load study streaks and activity heatmap: {getErrorMessage(error)}</span>
        </div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefetch}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Loading Activity
          </Button>
        </div>
      </div>
    );
  }

  const streaks = streaksQuery.data ?? null;
  const activity = activityQuery.data;
  const days = activity?.days ?? [];
  const totalMinutes = activity?.totalMinutes;
  const totalActiveDays = streaks?.totalActiveDays ?? activity?.activeDays ?? activity?.totalActiveDays;

  return (
    <section className={`space-y-4 ${className}`} aria-label="Study Streaks and Activity Heatmap" data-testid="study-activity-section">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-xs font-bold text-[#24242A] uppercase tracking-wider select-none">
          Study Streaks & Lifetime Consistency
        </h2>
        {isReadOnly && (
          <span className="text-[11px] font-semibold text-[#777782] bg-[#ECEBE7] px-2 py-0.5 rounded-md border border-[#E4E2DE] select-none">
            Mentor Read-Only
          </span>
        )}
      </div>

      {/* 4 Academic Streak & Lifetime Stat Cards */}
      <StreakSummary
        streaks={streaks}
        totalStudyMinutes={totalMinutes}
      />

      {/* GitHub-Inspired 365-Day Activity Matrix */}
      <ActivityHeatmap
        days={days}
        totalActiveDays={totalActiveDays}
        totalMinutes={totalMinutes}
      />
    </section>
  );
};

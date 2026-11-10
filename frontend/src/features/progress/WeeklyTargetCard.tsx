import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useWeeklyTarget } from '../../hooks/useProgress';
import type { WeeklyTargetResponse } from '../../types';
import {
  formatDateRange,
  formatHoursAndMinutes,
  getErrorMessage,
} from '../../utils/formatters';
import { EditWeeklyTargetModal } from './EditWeeklyTargetModal';

export interface WeeklyTargetCardProps {
  learnerId?: string;
  isReadOnly?: boolean;
  className?: string;
  initialData?: WeeklyTargetResponse;
}

export const WeeklyTargetCard: React.FC<WeeklyTargetCardProps> = ({
  learnerId,
  isReadOnly = false,
  className = '',
  initialData,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: fetchedTarget,
    isLoading,
    error,
  } = useWeeklyTarget(learnerId ? { learnerId } : undefined, {
    enabled: !initialData,
  });

  const data = initialData || fetchedTarget;

  if (isLoading && !data) {
    return (
      <div
        className={`bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs animate-pulse space-y-4 ${className}`}
        data-testid="weekly-target-loading"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E4E2DE]" />
            <div className="space-y-1.5">
              <div className="h-4 bg-[#E4E2DE] rounded w-36" />
              <div className="h-3 bg-[#E4E2DE] rounded w-28" />
            </div>
          </div>
          <div className="h-7 bg-[#E4E2DE] rounded w-24" />
        </div>
        <div className="h-3 bg-[#E4E2DE] rounded w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-[#E4E2DE] rounded w-16" />
              <div className="h-5 bg-[#E4E2DE] rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className={`bg-white rounded-xl border border-[#C45C5C]/25 p-5 shadow-xs ${className}`}
        data-testid="weekly-target-error"
      >
        <div className="flex items-center gap-2.5 text-[#C45C5C]">
          <Target className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block">Failed to load weekly study target</span>
            <span className="text-[#777782]">{getErrorMessage(error)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const safeRemainingMinutes = Math.max(0, data.remainingMinutes);
  const isExceeded = data.completedMinutes > data.targetMinutes;
  const isMet = data.isTargetMet;
  // Progress bar clamped between 0 and 100
  const clampedProgressValue = Math.min(100, Math.max(0, data.completionPercentage));

  const getStatusBadge = () => {
    if (isExceeded) {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Exceeded</span>
        </Badge>
      );
    }
    if (isMet) {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Target Met</span>
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        In Progress
      </Badge>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs ${className}`}
      data-testid="weekly-target-card"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E2DE]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EEEEFC] border border-[#5557C8]/20 flex items-center justify-center text-[#5557C8] shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#24242A] tracking-tight">
                Weekly Study Target
              </h3>
              {getStatusBadge()}
              {isReadOnly && (
                <span className="text-[10px] font-semibold text-[#777782] bg-[#F8F7F4] border border-[#E4E2DE] px-1.5 py-0.5 rounded">
                  Read-only
                </span>
              )}
            </div>
            <p className="text-xs text-[#777782] flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#777782]" />
              <span>{formatDateRange(data.weekStart, data.weekEnd)}</span>
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Pencil className="w-3.5 h-3.5 text-[#777782]" />}
            data-testid="edit-target-button"
          >
            Edit Target
          </Button>
        )}
      </div>

      {/* Progress Visualization */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#24242A]">
            <span>Progress:</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                isMet ? 'text-[#278568]' : 'text-[#5557C8]'
              }`}
              data-testid="progress-percentage-label"
            >
              {data.completionPercentage}%
            </span>
          </div>
          <span className="text-[11px] text-[#777782] font-medium">
            {isMet
              ? 'Weekly commitment satisfied!'
              : `${formatHoursAndMinutes(safeRemainingMinutes)} remaining this week`}
          </span>
        </div>

        <ProgressBar
          value={clampedProgressValue}
          max={100}
          size="md"
          variant={isMet ? 'success' : 'default'}
        />
      </div>

      {/* 4 Quantitative Breakdown Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-[#E4E2DE] text-xs">
        {/* Metric 1: Weekly Target */}
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">
            Weekly Target
          </span>
          <span
            className="text-sm font-bold text-[#24242A] tabular-nums block mt-0.5"
            data-testid="target-duration"
          >
            {formatHoursAndMinutes(data.targetMinutes)}
          </span>
          <span className="text-[10px] text-[#777782]">Target commitment</span>
        </div>

        {/* Metric 2: Completed */}
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">
            Completed
          </span>
          <span
            className="text-sm font-bold text-[#278568] tabular-nums block mt-0.5 flex items-center gap-1"
            data-testid="completed-duration"
          >
            <Clock className="w-3.5 h-3.5 text-[#278568]" />
            {formatHoursAndMinutes(data.completedMinutes)}
          </span>
          <span className="text-[10px] text-[#777782]">Actual study time</span>
        </div>

        {/* Metric 3: Remaining */}
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">
            Remaining
          </span>
          <span
            className="text-sm font-bold text-[#24242A] tabular-nums block mt-0.5"
            data-testid="remaining-duration"
          >
            {formatHoursAndMinutes(safeRemainingMinutes)}
          </span>
          <span className="text-[10px] text-[#777782]">
            {isMet ? 'Goal accomplished' : 'Time to target'}
          </span>
        </div>

        {/* Metric 4: Progress Percentage */}
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">
            Completion
          </span>
          <span
            className={`text-sm font-bold tabular-nums block mt-0.5 ${
              isMet ? 'text-[#278568]' : 'text-[#5557C8]'
            }`}
            data-testid="progress-metric"
          >
            {data.completionPercentage}%
          </span>
          <span className="text-[10px] text-[#777782]">
            {isMet ? 'Goal reached' : 'Of weekly target'}
          </span>
        </div>
      </div>

      {/* Target Exceeded Callout */}
      {isExceeded && (
        <div
          className="mt-3.5 p-2.5 bg-[#278568]/8 border border-[#278568]/20 rounded-lg flex items-center justify-between text-xs text-[#278568]"
          data-testid="target-exceeded-banner"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#278568]" />
            <span>
              Target exceeded by{' '}
              <strong className="font-bold">
                {formatHoursAndMinutes(data.completedMinutes - data.targetMinutes)}
              </strong>
              !
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-[#278568]/15 px-2 py-0.5 rounded text-[#278568]">
            {data.completedMinutes - data.targetMinutes}m over target
          </span>
        </div>
      )}

      {/* Edit Target Modal */}
      {!isReadOnly && isEditModalOpen && (
        <EditWeeklyTargetModal
          key={data.targetMinutes}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentTargetMinutes={data.targetMinutes}
        />
      )}
    </div>
  );
};

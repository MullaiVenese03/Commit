import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { LearnerSummary } from '../../types';
import { formatDate } from '../../utils/formatters';

interface LearnerCardProps {
  learner: LearnerSummary;
}

export const LearnerCard: React.FC<LearnerCardProps> = ({ learner }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isMastered = learner.completionPercentage === 100 && learner.totalTopics > 0;

  return (
    <Card className="flex flex-col justify-between h-full hover:border-zinc-300 transition-all duration-150">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {getInitials(learner.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-zinc-900 text-sm truncate tracking-tight">
                {learner.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">{learner.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3">
          <ProgressBar
            value={learner.completionPercentage}
            showValue
            label="Curriculum Mastery"
            size="sm"
            variant={isMastered ? 'success' : 'default'}
          />

          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div className="p-2 bg-zinc-50 rounded border border-zinc-200/60">
              <span className="text-zinc-400 block text-[11px] font-medium flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Curricula</span>
              </span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5 block">
                {learner.totalGoals} {learner.totalGoals === 1 ? 'goal' : 'goals'}
              </span>
            </div>
            <div className="p-2 bg-zinc-50 rounded border border-zinc-200/60">
              <span className="text-zinc-400 block text-[11px] font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Study Time</span>
              </span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5 block tabular-nums">
                {learner.totalHours} hrs
              </span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 pt-0.5">
            Enrolled {formatDate(learner.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">
          {learner.completedTopics} of {learner.totalTopics} milestones complete
        </span>
        <Link
          to={`/mentor/learners/${learner.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

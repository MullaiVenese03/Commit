import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle2, Clock, MoreVertical, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Goal } from '../../types';
import { formatDate, formatMinutes } from '../../utils/formatters';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  isReadOnly?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  isReadOnly = false,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const topics = goal.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.isCompleted).length;
  const progressPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Compute total study minutes if study sessions are present on topics
  const totalMinutesStudied = topics.reduce((sum, t) => {
    const sessionMins = (t.studySessions || []).reduce((acc, s) => acc + s.minutes, 0);
    return sum + sessionMins;
  }, 0);

  const isMastered = progressPercentage === 100 && totalTopics > 0;
  const isInProgress = progressPercentage > 0 && progressPercentage < 100;

  return (
    <Card className="flex flex-col justify-between h-full hover:border-black/[0.18] transition-all duration-150 group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {isMastered ? (
                <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                  Mastered
                </Badge>
              ) : isInProgress ? (
                <Badge variant="accent" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                  In Progress
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  {totalTopics === 0 ? 'Draft' : 'Not Started'}
                </Badge>
              )}

              {goal.learner?.name && (
                <span className="text-[11px] text-[#86868b] font-medium truncate max-w-[120px]">
                  {goal.learner.name}
                </span>
              )}
            </div>

            <Link
              to={`/goals/${goal.id}`}
              className="font-bold text-[#24242A] text-sm sm:text-base hover:text-[#5557C8] transition-colors line-clamp-1 block tracking-tight"
            >
              {goal.title}
            </Link>

            {goal.description && (
              <p className="text-xs text-[#777782] mt-1 line-clamp-2 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>

          {!isReadOnly && (onEdit || onDelete) && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 cursor-pointer transition"
                aria-label="Goal options"
              >
                <MoreVertical className="w-4 h-4 pointer-events-none" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-34 bg-white rounded-xl shadow-lg border border-[#E4E2DE] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(goal);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#24242A] hover:bg-[#F8F7F4] cursor-pointer transition font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#777782] shrink-0 pointer-events-none" />
                        <span className="pointer-events-none">Edit Goal</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(goal);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#C45C5C] hover:bg-[#C45C5C]/10 cursor-pointer transition font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0 pointer-events-none" />
                        <span className="pointer-events-none">Delete</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-3.5 pt-3 border-t border-[#E4E2DE] space-y-2">
          <ProgressBar
            value={progressPercentage}
            showValue
            label={`${completedTopics} of ${totalTopics} topics`}
            size="sm"
            variant={isMastered ? 'success' : 'default'}
          />

          <div className="flex items-center justify-between text-[11px] text-[#777782] pt-0.5">
            <span>Created {formatDate(goal.createdAt)}</span>
            {totalMinutesStudied > 0 && (
              <span className="flex items-center gap-1 text-[#24242A] font-medium tabular-nums">
                <Clock className="w-3 h-3 text-[#777782]" />
                <span>{formatMinutes(totalMinutesStudied)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#E4E2DE] flex items-center justify-between">
        <span className="text-xs font-medium text-[#777782] tabular-nums">
          {totalTopics} {totalTopics === 1 ? 'Milestone' : 'Milestones'}
        </span>
        <Link
          to={`/goals/${goal.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5557C8] hover:text-[#4446B4] transition py-1 px-1 -mr-1"
        >
          <span className="pointer-events-none">Curriculum</span>
          <ArrowRight className="w-3.5 h-3.5 pointer-events-none" />
        </Link>
      </div>
    </Card>
  );
};

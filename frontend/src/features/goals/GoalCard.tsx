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
    <Card className="flex flex-col justify-between h-full hover:border-zinc-300 transition-all duration-150 group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                  {totalTopics === 0 ? 'Draft Curriculum' : 'Not Started'}
                </Badge>
              )}

              {goal.learner?.name && (
                <span className="text-[11px] text-zinc-400 font-medium">
                  {goal.learner.name}
                </span>
              )}
            </div>

            <Link
              to={`/goals/${goal.id}`}
              className="font-bold text-zinc-900 text-base hover:text-blue-600 transition-colors line-clamp-1 block tracking-tight"
            >
              {goal.title}
            </Link>

            {goal.description && (
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>

          {!isReadOnly && (onEdit || onDelete) && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                aria-label="Goal options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-md border border-zinc-200 py-1 z-30">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(goal);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        Edit Goal
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(goal);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
          <ProgressBar
            value={progressPercentage}
            showValue
            label={`${completedTopics} of ${totalTopics} topics complete`}
            size="sm"
            variant={isMastered ? 'success' : 'default'}
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
            <span>Created {formatDate(goal.createdAt)}</span>
            {totalMinutesStudied > 0 && (
              <span className="flex items-center gap-1 text-zinc-600 font-medium">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{formatMinutes(totalMinutesStudied)} studied</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          {totalTopics} {totalTopics === 1 ? 'Topic' : 'Topics'}
        </span>
        <Link
          to={`/goals/${goal.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>View Curriculum</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

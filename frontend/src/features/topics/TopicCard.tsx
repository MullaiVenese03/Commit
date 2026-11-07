import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  Unlock,
} from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useCompleteTopic, useReopenTopic } from '../../hooks/useTopics';
import type { Topic } from '../../types';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import { PrerequisiteBadge } from './PrerequisiteBadge';

interface TopicCardProps {
  topic: Topic;
  onEdit?: (topic: Topic) => void;
  onDelete?: (topic: Topic) => void;
  onLogSession?: (topic: Topic) => void;
  isReadOnly?: boolean;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onEdit,
  onDelete,
  onLogSession,
  isReadOnly = false,
}) => {
  const completeMutation = useCompleteTopic();
  const reopenMutation = useReopenTopic();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);

  const handleComplete = async () => {
    setActionError(null);
    try {
      await completeMutation.mutateAsync(topic.id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleReopenConfirm = async () => {
    setIsReopenConfirmOpen(false);
    setActionError(null);
    try {
      await reopenMutation.mutateAsync(topic.id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const isCompleted = topic.isCompleted;
  // Strictly respect backend provided values
  const isUnlocked = topic.isUnlocked;
  const missingPrerequisites = topic.missingPrerequisites || [];
  const prerequisites = topic.prerequisites || [];
  const dependents = topic.dependents || [];

  return (
    <>
      <div
        className={`rounded-lg border p-4 sm:p-5 transition-all duration-150 ${
          isCompleted
            ? 'bg-emerald-50/20 border-emerald-200/90'
            : !isUnlocked
            ? 'bg-zinc-50/80 border-zinc-200 opacity-95'
            : 'bg-white border-zinc-200 shadow-2xs hover:border-zinc-300'
        }`}
      >
        {actionError && (
          <Alert variant="error" className="mb-3" onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                #{topic.position}
              </span>

              {isCompleted ? (
                <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                  Completed
                </Badge>
              ) : isUnlocked ? (
                <Badge variant="accent" size="sm" icon={<Unlock className="w-3 h-3" />}>
                  Available to Study
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
                  Locked
                </Badge>
              )}

              {isCompleted && topic.completedAt && (
                <span className="text-[11px] text-zinc-400">
                  Completed on {formatDate(topic.completedAt)}
                </span>
              )}
            </div>

            <h4
              className={`text-base font-bold tracking-tight ${
                isCompleted ? 'text-zinc-700 line-through decoration-zinc-400' : 'text-zinc-900'
              }`}
            >
              {topic.title}
            </h4>

            {topic.description && (
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {topic.description}
              </p>
            )}

            {/* Prerequisite relationships display */}
            {prerequisites.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-100">
                <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Prerequisites ({prerequisites.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {prerequisites.map((p) => (
                    <PrerequisiteBadge
                      key={p.id}
                      title={p.prerequisiteTopic?.title || 'Prerequisite'}
                      isCompleted={p.prerequisiteTopic?.isCompleted}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Missing Prerequisites alert if locked */}
            {!isCompleted && !isUnlocked && missingPrerequisites.length > 0 && (
              <div className="mt-3 flex items-start gap-2.5 text-xs text-amber-900 bg-amber-50/70 p-3 rounded border border-amber-200/80">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-950">Milestone Locked:</span> Complete the following prerequisite{missingPrerequisites.length > 1 ? 's' : ''} to unlock this topic:
                  <ul className="list-disc list-inside mt-1 font-medium space-y-0.5 text-amber-800">
                    {missingPrerequisites.map((m) => (
                      <li key={m.id}>{m.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Options dropdown */}
          {!isReadOnly && (onEdit || onDelete) && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                aria-label="Topic options"
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
                          onEdit(topic);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        Edit Topic
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(topic);
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

        {/* Action bar for learner */}
        {!isReadOnly && (
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {onLogSession && isUnlocked && !isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLogSession(topic)}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-zinc-500" />}
                >
                  Log Study Time
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isCompleted ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (dependents.length > 0) {
                      setIsReopenConfirmOpen(true);
                    } else {
                      handleReopenConfirm();
                    }
                  }}
                  isLoading={reopenMutation.isPending}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-zinc-600 hover:text-zinc-900"
                >
                  Reopen Topic
                </Button>
              ) : isUnlocked ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleComplete}
                  isLoading={completeMutation.isPending}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Mark Complete
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                  title="Complete prerequisites to unlock this topic"
                >
                  Topic Locked
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal for reopening a prerequisite topic */}
      <Modal
        isOpen={isReopenConfirmOpen}
        onClose={() => setIsReopenConfirmOpen(false)}
        title="Reopen Prerequisite Milestone"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReopenConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleReopenConfirm}
              isLoading={reopenMutation.isPending}
            >
              Confirm Reopen
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-zinc-600 leading-normal">
          <p>
            Reopening <strong className="text-zinc-900 font-semibold">{topic.title}</strong> will reset this milestone to incomplete.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded text-amber-900">
            <strong>Cascading Re-lock Notice:</strong> Because subsequent topics depend on this prerequisite, any dependent topics currently marked complete will automatically be reset to incomplete and re-locked until this topic is completed again.
          </div>
        </div>
      </Modal>
    </>
  );
};

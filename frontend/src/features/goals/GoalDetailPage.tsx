import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useGoal } from '../../hooks/useGoals';
import { useDeleteTopic } from '../../hooks/useTopics';
import type { Topic } from '../../types';
import { formatDate, formatMinutes, getErrorMessage } from '../../utils/formatters';
import { SessionLogModal } from '../sessions/SessionLogModal';
import { TopicCard } from '../topics/TopicCard';
import { TopicModal } from '../topics/TopicModal';
import { TopicReorderModal } from '../topics/TopicReorderModal';
import { DeleteGoalModal } from './DeleteGoalModal';
import { GoalModal } from './GoalModal';

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMentor } = useAuth();

  const { data: goal, isLoading, error } = useGoal(id || '');
  const deleteTopicMutation = useDeleteTopic();

  // Modals state
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [sessionTopic, setSessionTopic] = useState<Topic | null>(null);
  const [topicDeleteError, setTopicDeleteError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-zinc-600" />
        <p className="text-xs text-zinc-500 mt-3 font-medium">Loading goal curriculum...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/goals')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Goals
        </Button>
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
          {error ? getErrorMessage(error) : 'Study goal not found.'}
        </div>
      </div>
    );
  }

  const topics = goal.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.isCompleted).length;
  const progressPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Total study time for this goal
  const totalMinutesStudied = topics.reduce((sum, t) => {
    const sessionMins = (t.studySessions || []).reduce((acc, s) => acc + s.minutes, 0);
    return sum + sessionMins;
  }, 0);

  const handleDeleteTopicConfirm = async () => {
    if (!topicToDelete || !id) return;
    setTopicDeleteError(null);
    try {
      await deleteTopicMutation.mutateAsync({ id: topicToDelete.id, goalId: id });
      setTopicToDelete(null);
    } catch (err) {
      setTopicDeleteError(getErrorMessage(err));
    }
  };

  const breadcrumbsList = isMentor
    ? [
        { label: 'Learner Curricula', to: '/mentor/goals' },
        { label: goal.title },
      ]
    : [
        { label: 'Study Goals', to: '/goals' },
        { label: goal.title },
      ];

  return (
    <div className="space-y-6">
      {/* Top navigation with breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Breadcrumbs items={breadcrumbsList} />

        {!isMentor && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditGoalModalOpen(true)}
              leftIcon={<Pencil className="w-3.5 h-3.5" />}
            >
              Edit Goal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteGoalModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
              className="text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Goal Overview Card */}
      <div className="bg-white rounded-lg border border-zinc-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500">
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 text-[11px] uppercase tracking-wider">
                Curriculum
              </span>
              <span>•</span>
              <span>Created {formatDate(goal.createdAt)}</span>
              {goal.learner?.name && isMentor && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-zinc-700">
                    Learner: {goal.learner.name}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              {goal.title}
            </h1>

            {goal.description && (
              <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl pt-1">
                {goal.description}
              </p>
            )}

            {totalMinutesStudied > 0 && (
              <div className="flex items-center gap-1.5 pt-2 text-xs text-zinc-600">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Total focused study time: <strong className="text-zinc-900 font-semibold">{formatMinutes(totalMinutesStudied)}</strong></span>
              </div>
            )}
          </div>

          <div className="w-full md:w-64 shrink-0 p-4 bg-zinc-50/70 rounded-lg border border-zinc-200/80 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-600">Completion</span>
              <span className="font-bold text-zinc-950 tabular-nums">{progressPercentage}%</span>
            </div>
            <ProgressBar value={progressPercentage} size="md" variant={progressPercentage === 100 ? 'success' : 'default'} />
            <div className="flex justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60">
              <span>{completedTopics} completed</span>
              <span>{totalTopics - completedTopics} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-200/80">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-950">
              Curriculum Topics ({totalTopics})
            </h2>
            <p className="text-xs text-zinc-500">
              Prerequisite progression sequence. Unlocked topics are available for study and completion.
            </p>
          </div>

          {!isMentor && (
            <div className="flex items-center gap-2">
              {totalTopics > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReorderModalOpen(true)}
                  leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
                >
                  Reorder Sequence
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddTopicModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Topic
              </Button>
            </div>
          )}
        </div>

        {topics.length === 0 ? (
          <EmptyState
            title="No topics in this curriculum yet"
            description="Add topics to break this goal into actionable milestones with prerequisite relationships."
            icon={<BookOpen className="w-5 h-5 text-zinc-400" />}
            actionLabel={!isMentor ? 'Add First Topic' : undefined}
            onAction={!isMentor ? () => setIsAddTopicModalOpen(true) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onEdit={!isMentor ? (t) => setTopicToEdit(t) : undefined}
                onDelete={!isMentor ? (t) => setTopicToDelete(t) : undefined}
                onLogSession={!isMentor ? (t) => setSessionTopic(t) : undefined}
                isReadOnly={isMentor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Goal Modal */}
      <GoalModal
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
        goalToEdit={goal}
      />

      {/* Delete Goal Modal */}
      <DeleteGoalModal
        isOpen={isDeleteGoalModalOpen}
        onClose={() => setIsDeleteGoalModalOpen(false)}
        goal={goal}
      />

      {/* Add / Edit Topic Modal */}
      <TopicModal
        isOpen={isAddTopicModalOpen || !!topicToEdit}
        onClose={() => {
          setIsAddTopicModalOpen(false);
          setTopicToEdit(null);
        }}
        goalId={goal.id}
        topicToEdit={topicToEdit}
        siblingTopics={topics}
      />

      {/* Reorder Topics Modal */}
      <TopicReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        goalId={goal.id}
        topics={topics}
      />

      {/* Quick Session Log Modal */}
      <SessionLogModal
        isOpen={!!sessionTopic}
        onClose={() => setSessionTopic(null)}
        defaultTopic={sessionTopic}
      />

      {/* Delete Topic Confirmation Modal */}
      <Modal
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        title="Delete Topic Milestone"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTopicToDelete(null)}
              disabled={deleteTopicMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteTopicConfirm}
              isLoading={deleteTopicMutation.isPending}
            >
              Delete Topic
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {topicDeleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs">
              {topicDeleteError}
            </div>
          )}
          <p className="text-xs text-zinc-600 leading-normal">
            Are you sure you want to delete <strong className="text-zinc-900 font-semibold">{topicToDelete?.title}</strong>? Any study sessions logged under this topic and dependent prerequisite links will be removed.
          </p>
        </div>
      </Modal>
    </div>
  );
};

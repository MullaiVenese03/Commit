import React, { useState } from 'react';
import { Compass, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useGoals } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { DeleteGoalModal } from './DeleteGoalModal';
import { GoalCard } from './GoalCard';
import { GoalModal } from './GoalModal';

export const GoalListPage: React.FC = () => {
  const { data: goals = [], isLoading, error } = useGoals();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const filteredGoals = goals.filter((g) =>
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalGoals = goals.length;
  const totalTopics = goals.reduce((acc, g) => acc + (g.topics?.length || 0), 0);
  const completedCurricula = goals.filter((g) => {
    const topics = g.topics || [];
    return topics.length > 0 && topics.every((t) => t.isCompleted);
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Curriculum Management
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Study Goals
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Organize your learning path into structured technical curricula and track topic milestones.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create New Goal
        </Button>
      </div>

      {/* Summary Metrics & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <div>
            <span className="font-bold text-zinc-900">{totalGoals}</span> {totalGoals === 1 ? 'Curriculum' : 'Curricula'}
          </div>
          <span className="text-zinc-300">•</span>
          <div>
            <span className="font-bold text-zinc-900">{totalTopics}</span> Total Topics
          </div>
          <span className="text-zinc-300">•</span>
          <div>
            <span className="font-bold text-emerald-700">{completedCurricula}</span> Mastered
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            placeholder="Search curricula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs py-1.5"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-lg border border-zinc-200">
          <Spinner size="lg" className="text-zinc-600" />
          <p className="text-xs text-zinc-500 mt-3 font-medium">Loading study goals...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
          Failed to load study goals. Please try again.
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching goals found' : 'No study goals created yet'}
          description={
            searchTerm
              ? `No goals matched "${searchTerm}". Try a different search term or clear the filter.`
              : 'Create your first learning goal to start defining milestones, prerequisites, and tracking focused study sessions.'
          }
          icon={searchTerm ? <Search className="w-5 h-5 text-zinc-400" /> : <Compass className="w-5 h-5 text-zinc-400" />}
          actionLabel={searchTerm ? 'Clear Search' : 'Create First Goal'}
          onAction={searchTerm ? () => setSearchTerm('') : () => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => setGoalToEdit(g)}
              onDelete={(g) => setGoalToDelete(g)}
            />
          ))}
        </div>
      )}

      {/* Goal Creation / Edit Modal */}
      <GoalModal
        isOpen={isCreateModalOpen || !!goalToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteGoalModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        goal={goalToDelete}
      />
    </div>
  );
};

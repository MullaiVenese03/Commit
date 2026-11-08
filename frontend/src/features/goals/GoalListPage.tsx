import React, { useState } from 'react';
import { Compass, Plus, Search, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useGoals } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { DeleteGoalModal } from './DeleteGoalModal';
import { GoalCard } from './GoalCard';
import { GoalModal } from './GoalModal';

export const GoalListPage: React.FC = () => {
  const { data: goals = [], isLoading, error } = useGoals();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MASTERED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const totalGoals = goals.length;
  const totalTopics = goals.reduce((acc, g) => acc + (g.topics?.length || 0), 0);
  const completedTopics = goals.reduce((acc, g) => acc + (g.topics?.filter((t) => t.isCompleted).length || 0), 0);
  const completedCurricula = goals.filter((g) => {
    const topics = g.topics || [];
    return topics.length > 0 && topics.every((t) => t.isCompleted);
  }).length;
  const activeCurricula = totalGoals - completedCurricula;

  const filteredGoals = goals.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    const topics = g.topics || [];
    const isMastered = topics.length > 0 && topics.every((t) => t.isCompleted);

    if (statusFilter === 'MASTERED') return isMastered;
    if (statusFilter === 'ACTIVE') return !isMastered;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
            Curriculum Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            Study Goals
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
            Organize your academic pursuits into structured curricula, configure sequential milestones, and track completion progress.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Goal
        </Button>
      </div>

      {/* Contextual Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#E4E2DE] shadow-xs text-xs">
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">Total Curricula</span>
          <span className="font-bold text-[#24242A] text-sm sm:text-base tabular-nums">{totalGoals}</span>
        </div>
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">Active Curricula</span>
          <span className="font-bold text-[#5557C8] text-sm sm:text-base tabular-nums">{activeCurricula}</span>
        </div>
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">Milestones Defined</span>
          <span className="font-bold text-[#24242A] text-sm sm:text-base tabular-nums">{totalTopics} ({completedTopics} done)</span>
        </div>
        <div>
          <span className="text-[11px] text-[#777782] block font-medium select-none">Mastered Curricula</span>
          <span className="font-bold text-[#278568] text-sm sm:text-base tabular-nums">{completedCurricula}</span>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* macOS Segmented filter buttons */}
        <div className="inline-flex p-1 bg-[#ECEBE7] rounded-lg border border-[#E4E2DE] text-xs font-medium self-start select-none">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            All ({totalGoals})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            Active ({activeCurricula})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('MASTERED')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === 'MASTERED'
                ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                : 'text-[#777782] hover:text-[#24242A]'
            }`}
          >
            Mastered ({completedCurricula})
          </button>
        </div>

        {/* Search input with search icon and clear button */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#777782] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search curricula by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-7 py-2 text-xs rounded-lg border border-[#E4E2DE] bg-white text-[#24242A] placeholder:text-[#777782]/70 focus:outline-none focus:ring-2 focus:ring-[#5557C8]/20 focus:border-[#5557C8] transition shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#777782] hover:text-[#24242A] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#E4E2DE]">
          <Spinner size="lg" className="text-[#5557C8]" />
          <p className="text-xs text-[#777782] mt-3 font-medium">Loading study goals...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
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
          icon={searchTerm ? <Search className="w-5 h-5 text-[#777782]" /> : <Compass className="w-5 h-5 text-[#777782]" />}
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

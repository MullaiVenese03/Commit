import React, { useState } from 'react';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { useGoals } from '../../hooks/useGoals';
import { useLearners } from '../../hooks/useMentor';
import { GoalCard } from '../goals/GoalCard';

export const MentorGoalsPage: React.FC = () => {
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');
  const { data: learners = [] } = useLearners();
  const { data: goals = [], isLoading, error } = useGoals(selectedLearnerId || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Cohort Oversight
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Learner Curricula
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review active study goals and curriculum completion states across all cohort learners.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label="Filter by Learner"
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
            className="text-xs py-1"
          >
            <option value="">All Cohort Learners</option>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-lg border border-zinc-200">
          <Spinner size="lg" className="text-zinc-600" />
          <p className="text-xs text-zinc-500 mt-3 font-medium">Loading learner goals...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
          Failed to load goals.
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 bg-white rounded-lg border border-zinc-200">
          No curricula found for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} isReadOnly />
          ))}
        </div>
      )}
    </div>
  );
};

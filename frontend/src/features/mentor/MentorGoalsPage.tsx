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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
            Cohort Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            Learner Curricula
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
            Review active study goals and curriculum completion states across all cohort learners.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label="Filter by Learner"
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
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
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#E4E2DE]">
          <Spinner size="lg" className="text-[#5557C8]" />
          <p className="text-xs text-[#777782] mt-3 font-medium">Loading learner goals...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
          Failed to load goals.
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#777782] bg-white rounded-xl border border-[#E4E2DE]">
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

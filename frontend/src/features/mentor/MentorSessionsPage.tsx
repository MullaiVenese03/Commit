import React, { useState } from 'react';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { useLearners } from '../../hooks/useMentor';
import { useSessions } from '../../hooks/useSessions';
import type { FilterSessionsParams } from '../../services/sessions.service';
import { SessionFilters } from '../sessions/SessionFilters';
import { SessionTable } from '../sessions/SessionTable';

export const MentorSessionsPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterSessionsParams>({});
  const { data: learners = [] } = useLearners();
  const { data: sessions = [], isLoading, error } = useSessions(filters);

  const handleLearnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      learnerId: e.target.value || undefined,
      goalId: undefined,
      topicId: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
            Cohort Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            All Study Sessions
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
            Monitor study session consistency, notes, and topic engagements across the cohort.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label="Filter Cohort Learner"
            value={filters.learnerId || ''}
            onChange={handleLearnerChange}
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

      <SessionFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#E4E2DE]">
          <Spinner size="lg" className="text-[#5557C8]" />
          <p className="text-xs text-[#777782] mt-3 font-medium">Loading session records...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
          Failed to load study sessions.
        </div>
      ) : (
        <SessionTable sessions={sessions} isReadOnly />
      )}
    </div>
  );
};

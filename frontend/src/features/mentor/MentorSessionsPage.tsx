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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Cohort Oversight
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            All Study Sessions
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Monitor study session consistency, notes, and topic engagements across the cohort.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label="Filter Cohort Learner"
            value={filters.learnerId || ''}
            onChange={handleLearnerChange}
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

      <SessionFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-lg border border-zinc-200">
          <Spinner size="lg" className="text-zinc-600" />
          <p className="text-xs text-zinc-500 mt-3 font-medium">Loading session records...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
          Failed to load study sessions.
        </div>
      ) : (
        <SessionTable sessions={sessions} isReadOnly />
      )}
    </div>
  );
};

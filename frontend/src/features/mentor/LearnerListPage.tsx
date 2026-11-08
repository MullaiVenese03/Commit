import React, { useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useLearners } from '../../hooks/useMentor';
import { LearnerCard } from './LearnerCard';

export const LearnerListPage: React.FC = () => {
  const { data: learners = [], isLoading, error } = useLearners();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLearners = learners.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
            Academic Cohort
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            Learner Directory
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
            Track and support enrolled learners, observe study progress, and review milestone completions.
          </p>
        </div>

        {/* Search input with search icon and clear button */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#777782] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search learners by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-7 py-2 text-xs rounded-lg border border-[#E4E2DE] bg-white text-[#24242A] placeholder:text-[#777782]/70 focus:outline-none focus:ring-2 focus:ring-[#5557C8]/20 focus:border-[#5557C8] transition shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#24242A] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#E4E2DE]">
          <Spinner size="lg" className="text-[#5557C8]" />
          <p className="text-xs text-[#777782] mt-3 font-medium">Loading learner directory...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
          Failed to load learners list. Please try again.
        </div>
      ) : filteredLearners.length === 0 ? (
        <EmptyState
          title="No learners match your query"
          description={
            searchTerm
              ? `No learners found matching "${searchTerm}". Try a different keyword.`
              : 'No learners are currently registered in the system.'
          }
          icon={searchTerm ? <Search className="w-5 h-5 text-[#777782]" /> : <Users className="w-5 h-5 text-[#777782]" />}
          actionLabel={searchTerm ? 'Clear Search' : undefined}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLearners.map((learner) => (
            <LearnerCard key={learner.id} learner={learner} />
          ))}
        </div>
      )}
    </div>
  );
};

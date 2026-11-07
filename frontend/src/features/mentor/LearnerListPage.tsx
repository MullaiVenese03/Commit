import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Academic Cohort
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Learner Directory
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track and support enrolled learners, observe study progress, and review milestone completions.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search learners by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs py-1.5"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-lg border border-zinc-200">
          <Spinner size="lg" className="text-zinc-600" />
          <p className="text-xs text-zinc-500 mt-3 font-medium">Loading learner directory...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
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
          icon={searchTerm ? <Search className="w-5 h-5 text-zinc-400" /> : <Users className="w-5 h-5 text-zinc-400" />}
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

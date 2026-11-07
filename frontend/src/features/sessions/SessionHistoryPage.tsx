import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useSessions } from '../../hooks/useSessions';
import type { FilterSessionsParams } from '../../services/sessions.service';
import { formatMinutes } from '../../utils/formatters';
import { SessionFilters } from './SessionFilters';
import { SessionLogModal } from './SessionLogModal';
import { SessionTable } from './SessionTable';

export const SessionHistoryPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterSessionsParams>({});
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { data: sessions = [], isLoading, error } = useSessions(filters);

  const totalFilteredMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Focused Study Log
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Study Sessions
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review detailed study logs, filter by curriculum, and monitor focused academic effort.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsLogModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Log Study Session
        </Button>
      </div>

      {/* Summary metric bar */}
      <div className="flex items-center justify-between text-xs text-zinc-600 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-zinc-900">{sessions.length}</span> {sessions.length === 1 ? 'Session' : 'Sessions'} Recorded
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Total Study: <strong className="text-zinc-900 font-bold">{formatMinutes(totalFilteredMinutes)}</strong></span>
          </div>
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
          <p className="text-xs text-zinc-500 mt-3 font-medium">Loading session history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
          Failed to load study sessions. Please try refreshing the page.
        </div>
      ) : (
        <SessionTable sessions={sessions} />
      )}

      <SessionLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};

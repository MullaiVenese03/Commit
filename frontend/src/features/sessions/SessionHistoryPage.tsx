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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] block select-none">
            Focused Study Log
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            Study Sessions
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
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
      <div className="flex items-center justify-between text-xs text-[#777782] bg-white p-4 rounded-xl border border-[#E4E2DE] shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-[#24242A] tabular-nums">{sessions.length}</span> {sessions.length === 1 ? 'Session' : 'Sessions'} Recorded
          </div>
          <span className="text-[#E4E2DE]">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#777782]" />
            <span>Total Study: <strong className="text-[#24242A] font-bold tabular-nums">{formatMinutes(totalFilteredMinutes)}</strong></span>
          </div>
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
          <p className="text-xs text-[#777782] mt-3 font-medium">Loading session history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
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

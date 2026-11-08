import React, { useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Clock, FileText, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useDeleteSession } from '../../hooks/useSessions';
import type { StudySession } from '../../types';
import { formatDate, formatMinutes, getErrorMessage } from '../../utils/formatters';

interface SessionTableProps {
  sessions: StudySession[];
  isReadOnly?: boolean;
}

export const SessionTable: React.FC<SessionTableProps> = ({
  sessions,
  isReadOnly = false,
}) => {
  const deleteMutation = useDeleteSession();
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(sessionToDelete.id);
      setSessionToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No study sessions found"
        description="No records match your selected filters or no study sessions have been logged yet."
        icon={<Clock className="w-5 h-5 text-[#777782]" />}
      />
    );
  }

  return (
    <>
      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-xl border border-[#E4E2DE] shadow-xs">
        <table className="w-full text-left text-xs text-[#24242A]">
          <thead className="bg-[#F8F7F4] border-b border-[#E4E2DE] text-[10px] uppercase font-bold text-[#777782] tracking-wider select-none">
            <tr>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Topic & Curriculum
              </th>
              <th scope="col" className="px-4 py-3">
                Duration
              </th>
              <th scope="col" className="px-4 py-3">
                Notes & Reflections
              </th>
              {!isReadOnly && (
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E2DE]/70">
            {sessions.map((session) => {
              const goalId = session.topic?.goalId || session.topic?.goal?.id;

              return (
                <tr key={session.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-[#24242A] whitespace-nowrap tabular-nums">
                    {formatDate(session.studyDate)}
                  </td>
                  <td className="px-4 py-3.5 min-w-[180px]">
                    <div className="font-semibold text-[#24242A]">
                      {goalId ? (
                        <Link
                          to={`/goals/${goalId}`}
                          className="hover:text-[#5557C8] hover:underline transition-colors"
                        >
                          {session.topic?.title || 'Unknown Topic'}
                        </Link>
                      ) : (
                        session.topic?.title || 'Unknown Topic'
                      )}
                    </div>
                    {session.topic?.goal?.title && (
                      <div className="text-[11px] text-[#777782] mt-0.5 truncate max-w-xs">
                        {session.topic.goal.title}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8F7F4] border border-[#E4E2DE] text-[#24242A] text-[11px] font-semibold tabular-nums">
                      <Clock className="w-3 h-3 text-[#777782]" />
                      {formatMinutes(session.minutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#777782] max-w-sm">
                    {session.note ? (
                      <span className="line-clamp-2 leading-relaxed italic text-[#777782]">
                        "{session.note}"
                      </span>
                    ) : (
                      <span className="text-[#E4E2DE]">-</span>
                    )}
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="xs"
                        isIconOnly
                        onClick={() => setSessionToDelete(session)}
                        className="text-[#777782] hover:text-[#C45C5C] hover:bg-[#C45C5C]/10"
                        title="Delete Session Log"
                        aria-label={`Delete study session for ${session.topic?.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive List View */}
      <div className="sm:hidden space-y-3">
        {sessions.map((session) => {
          const goalId = session.topic?.goalId || session.topic?.goal?.id;

          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-[#E4E2DE] p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#24242A] truncate">
                    {goalId ? (
                      <Link to={`/goals/${goalId}`} className="hover:text-[#5557C8]">
                        {session.topic?.title || 'Unknown Topic'}
                      </Link>
                    ) : (
                      session.topic?.title || 'Unknown Topic'
                    )}
                  </div>
                  {session.topic?.goal?.title && (
                    <div className="text-[11px] text-[#777782] truncate mt-0.5">
                      {session.topic.goal.title}
                    </div>
                  )}
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setSessionToDelete(session)}
                    className="p-1 rounded text-[#777782] hover:text-[#C45C5C] hover:bg-[#C45C5C]/10 transition cursor-pointer shrink-0"
                    aria-label={`Delete session for ${session.topic?.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#777782] pt-1.5 border-t border-[#E4E2DE]">
                <span className="flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3 h-3 text-[#777782]" />
                  <span>{formatDate(session.studyDate)}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#24242A] bg-[#F8F7F4] border border-[#E4E2DE] px-2.5 py-0.5 rounded-md tabular-nums">
                  <Clock className="w-3 h-3 text-[#777782]" />
                  <span>{formatMinutes(session.minutes)}</span>
                </span>
              </div>

              {session.note && (
                <div className="text-xs text-[#777782] bg-[#F8F7F4] p-2.5 rounded-lg border border-[#E4E2DE] italic flex items-start gap-1.5">
                  <FileText className="w-3 h-3 text-[#777782] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{session.note}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title="Delete Session Record"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSessionToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#777782] leading-normal">
          {deleteError && (
            <div className="p-3 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-lg">
              {deleteError}
            </div>
          )}
          <p>
            Are you sure you want to delete this study session record (
            <strong className="text-[#24242A] font-semibold">{formatMinutes(sessionToDelete?.minutes || 0)}</strong> on{' '}
            <strong className="text-[#24242A] font-semibold">{formatDate(sessionToDelete?.studyDate || null)}</strong>)?
          </p>
          <p className="text-[#777782]">
            This study time will be subtracted from your cumulative totals and activity analytics.
          </p>
        </div>
      </Modal>
    </>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router';
import { Clock, Trash2 } from 'lucide-react';
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
        icon={<Clock className="w-5 h-5 text-zinc-400" />}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border border-zinc-200/90 shadow-2xs">
        <table className="w-full text-left text-xs text-zinc-700">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
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
          <tbody className="divide-y divide-zinc-100">
            {sessions.map((session) => {
              const goalId = session.topic?.goalId || session.topic?.goal?.id;

              return (
                <tr key={session.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
                    {formatDate(session.studyDate)}
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="font-semibold text-zinc-900">
                      {goalId ? (
                        <Link
                          to={`/goals/${goalId}`}
                          className="hover:text-blue-600 hover:underline transition-colors"
                        >
                          {session.topic?.title || 'Unknown Topic'}
                        </Link>
                      ) : (
                        session.topic?.title || 'Unknown Topic'
                      )}
                    </div>
                    {session.topic?.goal?.title && (
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-xs">
                        {session.topic.goal.title}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-[11px] font-semibold tabular-nums">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {formatMinutes(session.minutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 max-w-sm">
                    {session.note ? (
                      <span className="line-clamp-2 leading-relaxed italic text-zinc-600">
                        "{session.note}"
                      </span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToDelete(session)}
                        className="text-zinc-400 hover:text-rose-600 p-1 h-7"
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
        <div className="space-y-3 text-xs text-zinc-600">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
              {deleteError}
            </div>
          )}
          <p>
            Are you sure you want to delete this study session record (
            <strong className="text-zinc-900 font-semibold">{formatMinutes(sessionToDelete?.minutes || 0)}</strong> on{' '}
            <strong className="text-zinc-900 font-semibold">{formatDate(sessionToDelete?.studyDate || null)}</strong>)?
          </p>
          <p className="text-zinc-400">
            This study time will be subtracted from your cumulative totals and activity analytics.
          </p>
        </div>
      </Modal>
    </>
  );
};

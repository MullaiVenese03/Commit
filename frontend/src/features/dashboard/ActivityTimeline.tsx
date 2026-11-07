import React from 'react';
import { Link } from 'react-router';
import { Clock, FileText } from 'lucide-react';
import type { StudySession } from '../../types';
import { formatDate, formatMinutes } from '../../utils/formatters';

interface ActivityTimelineProps {
  sessions: StudySession[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-zinc-500">
        No recent study sessions logged.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-6">
        {sessions.map((session, index) => {
          const isLast = index === sessions.length - 1;
          const goalId = session.topic?.goalId || session.topic?.goal?.id;

          return (
            <li key={session.id}>
              <div className="relative pb-6">
                {!isLast && (
                  <span
                    className="absolute top-3.5 left-3.5 -ml-px h-full w-px bg-zinc-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate">
                          {goalId ? (
                            <Link
                              to={`/goals/${goalId}`}
                              className="hover:text-blue-600 hover:underline transition-colors"
                            >
                              {session.topic?.title || 'Topic Study'}
                            </Link>
                          ) : (
                            session.topic?.title || 'Topic Study'
                          )}
                        </p>
                        {session.topic?.goal?.title && (
                          <p className="text-[11px] text-zinc-500 truncate">
                            {session.topic.goal.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/60 tabular-nums">
                          {formatMinutes(session.minutes)}
                        </span>
                        <time className="block text-[11px] text-zinc-400 mt-0.5">
                          {formatDate(session.studyDate)}
                        </time>
                      </div>
                    </div>

                    {session.note && (
                      <div className="mt-1.5 text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200/60 flex items-start gap-1.5 leading-normal">
                        <FileText className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{session.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

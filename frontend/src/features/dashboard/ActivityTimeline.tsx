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
      <div className="text-center py-8 text-xs text-[#777782]">
        No recent study sessions logged.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-5">
        {sessions.map((session, index) => {
          const isLast = index === sessions.length - 1;
          const goalId = session.topic?.goalId || session.topic?.goal?.id;

          return (
            <li key={session.id}>
              <div className="relative pb-5">
                {!isLast && (
                  <span
                    className="absolute top-3.5 left-3.5 -ml-px h-full w-px bg-[#E4E2DE]"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E4E2DE] text-[#777782] flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#777782]" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#24242A] truncate">
                          {goalId ? (
                            <Link
                              to={`/goals/${goalId}`}
                              className="hover:text-[#5557C8] hover:underline transition-colors"
                            >
                              {session.topic?.title || 'Topic Study'}
                            </Link>
                          ) : (
                            session.topic?.title || 'Topic Study'
                          )}
                        </p>
                        {session.topic?.goal?.title && (
                          <p className="text-[11px] text-[#777782] truncate">
                            {session.topic.goal.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F8F7F4] text-[#24242A] border border-[#E4E2DE] tabular-nums">
                          {formatMinutes(session.minutes)}
                        </span>
                        <time className="block text-[10px] text-[#777782] mt-0.5">
                          {formatDate(session.studyDate)}
                        </time>
                      </div>
                    </div>

                    {session.note && (
                      <div className="mt-1.5 text-xs text-[#777782] bg-[#F8F7F4] p-2.5 rounded-lg border border-[#E4E2DE] flex items-start gap-1.5 leading-normal">
                        <FileText className="w-3.5 h-3.5 text-[#777782] shrink-0 mt-0.5" />
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

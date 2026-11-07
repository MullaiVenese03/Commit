import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Mail,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { useLearnerGoals, useLearnerSessions } from '../../hooks/useMentor';
import { useLearnerProgress } from '../../hooks/useProgress';
import { formatMinutes, getErrorMessage } from '../../utils/formatters';
import { StatCard } from '../dashboard/StatCard';
import { ProgressCharts } from '../progress/ProgressCharts';
import { SessionTable } from '../sessions/SessionTable';
import { TopicCard } from '../topics/TopicCard';

export const LearnerDetailPage: React.FC = () => {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'goals' | 'sessions' | 'charts'>('goals');

  const {
    data: progress,
    isLoading: isProgressLoading,
    error: progressError,
  } = useLearnerProgress(learnerId || '');

  const {
    data: goals = [],
    isLoading: isGoalsLoading,
  } = useLearnerGoals(learnerId || '');

  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
  } = useLearnerSessions(learnerId || '');

  if (isProgressLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-zinc-600" />
        <p className="text-xs text-zinc-500 mt-3 font-medium">
          Loading learner profile and analytics...
        </p>
      </div>
    );
  }

  if (progressError || !progress) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/mentor/learners')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Learners
        </Button>
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
          {progressError ? getErrorMessage(progressError) : 'Learner profile not found.'}
        </div>
      </div>
    );
  }

  const { learner, overview, goals: goalProgress } = progress;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const breadcrumbsList = [
    { label: 'Learners Directory', to: '/mentor/learners' },
    { label: learner.name },
  ];

  return (
    <div className="space-y-6">
      {/* Top breadcrumbs */}
      <Breadcrumbs items={breadcrumbsList} />

      {/* Learner Profile Header */}
      <div className="bg-white rounded-lg border border-zinc-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
              {getInitials(learner.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-950 tracking-tight truncate">
                  {learner.name}
                </h1>
                <Badge variant="neutral" size="sm">
                  {learner.role}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{learner.email}</span>
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 p-3 bg-zinc-50 rounded border border-zinc-200/80 space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-600">Curriculum Mastery</span>
              <span className="font-bold text-zinc-900 tabular-nums">{overview.completionPercentage}%</span>
            </div>
            <ProgressBar value={overview.completionPercentage} size="sm" variant={overview.completionPercentage === 100 ? 'success' : 'default'} />
            <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5 border-t border-zinc-200/60">
              <span>{overview.completedTopics}/{overview.totalTopics} topics</span>
              <span className="font-medium text-zinc-700">{formatMinutes(overview.totalMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Curricula"
          value={overview.totalGoals}
          subtitle="Enrolled learning paths"
          icon={<Compass className="w-4 h-4 text-zinc-600" />}
          iconBgColor="bg-zinc-100"
        />

        <StatCard
          title="Milestones Completed"
          value={`${overview.completedTopics} / ${overview.totalTopics}`}
          subtitle={`${overview.remainingTopics} topics pending`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Verified Study Time"
          value={formatMinutes(overview.totalMinutes)}
          subtitle={`${overview.totalHours} total study hours`}
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="Sessions Logged"
          value={overview.totalSessions}
          subtitle="Individual study blocks"
          icon={<BookOpen className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`py-2.5 px-1 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'goals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            Curricula & Topics ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-2.5 px-1 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            Study Sessions ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`py-2.5 px-1 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'charts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            Visual Analytics
          </button>
        </nav>
      </div>

      {/* Tab 1: Goals and topics */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {isGoalsLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Loading curricula...
            </div>
          ) : goals.length === 0 ? (
            <EmptyState
              title="No curricula found"
              description="This learner has not established any study goals yet."
              icon={<BookOpen className="w-5 h-5 text-zinc-400" />}
            />
          ) : (
            <div className="space-y-6">
              {goals.map((g) => {
                const topics = g.topics || [];
                const completedCount = topics.filter((t) => t.isCompleted).length;
                const pct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

                return (
                  <Card key={g.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                      <div>
                        <h3 className="font-bold text-zinc-900 text-base">{g.title}</h3>
                        {g.description && (
                          <p className="text-xs text-zinc-500 mt-0.5">{g.description}</p>
                        )}
                      </div>
                      <div className="w-full sm:w-48 space-y-1 shrink-0">
                        <div className="flex justify-between text-[11px] text-zinc-500">
                          <span>{completedCount}/{topics.length} topics</span>
                          <span className="font-semibold text-zinc-900 tabular-nums">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} size="sm" variant={pct === 100 ? 'success' : 'default'} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Topic Progression Sequence:
                      </span>
                      {topics.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">No topics defined in this curriculum.</p>
                      ) : (
                        <div className="space-y-2">
                          {topics.map((topic) => (
                            <TopicCard key={topic.id} topic={topic} isReadOnly />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Study Sessions */}
      {activeTab === 'sessions' && (
        <div>
          {isSessionsLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Loading sessions...
            </div>
          ) : (
            <SessionTable sessions={sessions} isReadOnly />
          )}
        </div>
      )}

      {/* Tab 3: Visual Analytics */}
      {activeTab === 'charts' && (
        <div>
          <ProgressCharts overview={overview} goals={goalProgress} />
        </div>
      )}
    </div>
  );
};

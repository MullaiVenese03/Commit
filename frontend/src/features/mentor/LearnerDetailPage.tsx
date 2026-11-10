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
import { StudyActivitySection } from '../progress/StudyActivitySection';
import { WeeklyTargetCard } from '../progress/WeeklyTargetCard';
import { SessionTable } from '../sessions/SessionTable';
import { TopicCard } from '../topics/TopicCard';

export const LearnerDetailPage: React.FC = () => {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'goals' | 'sessions' | 'activity' | 'charts'>('goals');

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
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
        <Spinner size="lg" className="text-[#5557C8]" />
        <p className="text-xs text-[#777782] mt-3 font-medium">
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
        <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
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
      <div className="bg-white rounded-xl border border-[#E4E2DE] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#24242A] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
              {getInitials(learner.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#24242A] tracking-tight truncate">
                  {learner.name}
                </h1>
                <Badge variant="neutral" size="sm">
                  {learner.role}
                </Badge>
              </div>
              <p className="text-xs text-[#777782] flex items-center gap-1.5 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 text-[#777782] shrink-0" />
                <span>{learner.email}</span>
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 p-3.5 bg-[#F8F7F4] rounded-xl border border-[#E4E2DE] space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#777782] select-none">Curriculum Mastery</span>
              <span className="font-bold text-[#24242A] tabular-nums">{overview.completionPercentage}%</span>
            </div>
            <ProgressBar value={overview.completionPercentage} size="sm" variant={overview.completionPercentage === 100 ? 'success' : 'default'} />
            <div className="flex justify-between text-[11px] text-[#777782] pt-1 border-t border-[#E4E2DE]">
              <span>{overview.completedTopics}/{overview.totalTopics} topics</span>
              <span className="font-medium text-[#24242A] tabular-nums">{formatMinutes(overview.totalMinutes)}</span>
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
          icon={<Compass className="w-4 h-4 text-[#777782]" />}
          iconBgColor="bg-[#F8F7F4] border border-[#E4E2DE]"
        />

        <StatCard
          title="Milestones Completed"
          value={`${overview.completedTopics} / ${overview.totalTopics}`}
          subtitle={`${overview.remainingTopics} topics pending`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#278568]" />}
          iconBgColor="bg-[#278568]/12 border border-[#278568]/25"
        />

        <StatCard
          title="Verified Study Time"
          value={formatMinutes(overview.totalMinutes)}
          subtitle={`${overview.totalHours} total study hours`}
          icon={<Clock className="w-4 h-4 text-[#5557C8]" />}
          iconBgColor="bg-[#EEEEFC] border border-[#5557C8]/25"
        />

        <StatCard
          title="Sessions Logged"
          value={overview.totalSessions}
          subtitle="Individual study blocks"
          icon={<BookOpen className="w-4 h-4 text-[#B98237]" />}
          iconBgColor="bg-[#B98237]/10 border border-[#B98237]/25"
        />
      </div>

      {/* Learner Weekly Study Target (Mentor Read-Only Inspection) */}
      <WeeklyTargetCard learnerId={learnerId} isReadOnly />

      {/* macOS-style segmented tabs navigation */}
      <div className="inline-flex p-1 bg-[#ECEBE7] rounded-xl border border-[#E4E2DE] text-xs font-medium select-none">
        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'goals'
              ? 'bg-white text-[#24242A] font-semibold shadow-xs'
              : 'text-[#777782] hover:text-[#24242A]'
          }`}
        >
          Curricula & Topics ({goals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-white text-[#24242A] font-semibold shadow-xs'
              : 'text-[#777782] hover:text-[#24242A]'
          }`}
        >
          Study Sessions ({sessions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-white text-[#24242A] font-semibold shadow-xs'
              : 'text-[#777782] hover:text-[#24242A]'
          }`}
        >
          Activity & Streaks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'charts'
              ? 'bg-white text-[#24242A] font-semibold shadow-xs'
              : 'text-[#777782] hover:text-[#24242A]'
          }`}
        >
          Visual Analytics
        </button>
      </div>

      {/* Tab 1: Goals and topics */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {isGoalsLoading ? (
            <div className="py-12 text-center text-xs text-[#777782]">
              Loading curricula...
            </div>
          ) : goals.length === 0 ? (
            <EmptyState
              title="No curricula found"
              description="This learner has not established any study goals yet."
              icon={<BookOpen className="w-5 h-5 text-[#777782]" />}
            />
          ) : (
            <div className="space-y-6">
              {goals.map((g) => {
                const topics = g.topics || [];
                const completedCount = topics.filter((t) => t.isCompleted).length;
                const pct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

                return (
                  <Card key={g.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E4E2DE]">
                      <div>
                        <h3 className="font-bold text-[#24242A] text-base">{g.title}</h3>
                        {g.description && (
                          <p className="text-xs text-[#777782] mt-0.5">{g.description}</p>
                        )}
                      </div>
                      <div className="w-full sm:w-48 space-y-1 shrink-0">
                        <div className="flex justify-between text-[11px] text-[#777782]">
                          <span>{completedCount}/{topics.length} topics</span>
                          <span className="font-semibold text-[#24242A] tabular-nums">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} size="sm" variant={pct === 100 ? 'success' : 'default'} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[10px] font-semibold text-[#777782] uppercase tracking-wider select-none">
                        Topic Progression Sequence:
                      </span>
                      {topics.length === 0 ? (
                        <p className="text-xs text-[#777782] italic">No topics defined in this curriculum.</p>
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
            <div className="py-12 text-center text-xs text-[#777782]">
              Loading sessions...
            </div>
          ) : (
            <SessionTable sessions={sessions} isReadOnly />
          )}
        </div>
      )}

      {/* Tab 3: Activity Heatmap & Streaks */}
      {activeTab === 'activity' && (
        <div>
          <StudyActivitySection learnerId={learner.id} isReadOnly />
        </div>
      )}

      {/* Tab 4: Visual Analytics */}
      {activeTab === 'charts' && (
        <div>
          <ProgressCharts overview={overview} goals={goalProgress} />
        </div>
      )}
    </div>
  );
};

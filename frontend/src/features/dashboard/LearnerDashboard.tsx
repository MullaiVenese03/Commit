import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useMyProgress } from '../../hooks/useProgress';
import { useSessions } from '../../hooks/useSessions';
import { formatMinutes } from '../../utils/formatters';
import { GoalModal } from '../goals/GoalModal';
import { SessionLogModal } from '../sessions/SessionLogModal';
import { ActivityTimeline } from './ActivityTimeline';
import { StatCard } from './StatCard';
import { WeeklyActivityChart } from './WeeklyActivityChart';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: progress, isLoading, error } = useMyProgress();
  const { data: allSessions = [] } = useSessions();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Time-aware contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
        <Spinner size="lg" className="text-[#5557C8]" />
        <p className="text-xs text-[#777782] mt-3 font-medium">
          Loading learning dashboard...
        </p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="p-4 bg-[#C45C5C]/10 border border-[#C45C5C]/25 text-[#C45C5C] rounded-xl text-xs leading-normal">
        Failed to load progress dashboard. Please try refreshing the page.
      </div>
    );
  }

  const { overview, goals, recentSessions } = progress;
  // Use all sessions for chart if available, otherwise fallback to recentSessions
  const sessionsForChart = allSessions.length > 0 ? allSessions : recentSessions;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page introduction & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] select-none">
              Academic Overview
            </span>
            <span className="text-[#E4E2DE]">•</span>
            <span className="text-[11px] text-[#777782] select-none">
              {formattedDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
            Track milestone prerequisites, verify study consistency, and maintain focused academic momentum.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            leftIcon={<Compass className="w-3.5 h-3.5 text-[#777782]" />}
          >
            Create Goal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSessionModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Log Study Session
          </Button>
        </div>
      </div>

      {/* Learning Overview & Overall Progress Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Overall Curriculum Mastery Hero Panel */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777782] uppercase tracking-wider select-none">
                Curriculum Mastery
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#278568] bg-[#278568]/12 px-2.5 py-0.5 rounded-md border border-[#278568]/25 select-none">
                <CheckCircle2 className="w-3 h-3" />
                <span className="tabular-nums">{overview.completedTopics}/{overview.totalTopics} Topics</span>
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#24242A] tracking-tight tabular-nums">
                {overview.completionPercentage}%
              </span>
              <span className="text-xs text-[#777782] font-medium select-none">cumulative completion</span>
            </div>

            <div className="mt-3.5">
              <ProgressBar
                value={overview.completionPercentage}
                size="md"
                variant={overview.completionPercentage === 100 ? 'success' : 'default'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-[#E4E2DE] text-xs">
            <div>
              <span className="text-[11px] text-[#777782] block font-medium select-none">Completed Milestones</span>
              <span className="font-bold text-[#24242A] text-sm tabular-nums">{overview.completedTopics} topics</span>
            </div>
            <div>
              <span className="text-[11px] text-[#777782] block font-medium select-none">Remaining Milestones</span>
              <span className="font-bold text-[#24242A] text-sm tabular-nums">{overview.remainingTopics} topics</span>
            </div>
          </div>
        </div>

        {/* Supporting Metric Cards & Weekly Activity Chart */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Active Curricula"
            value={overview.totalGoals}
            subtitle={`${goals.length} curricula active`}
            icon={<Compass className="w-4 h-4 text-[#777782]" />}
            iconBgColor="bg-[#F8F7F4] border border-[#E4E2DE]"
          />

          <StatCard
            title="Total Study Time"
            value={formatMinutes(overview.totalMinutes)}
            subtitle={`${overview.totalHours} total study hours`}
            icon={<Clock className="w-4 h-4 text-[#5557C8]" />}
            iconBgColor="bg-[#EEEEFC] border border-[#5557C8]/20"
          />

          <StatCard
            title="Verified Sessions"
            value={overview.totalSessions}
            subtitle="Focused study logs"
            icon={<Flame className="w-4 h-4 text-[#B98237]" />}
            iconBgColor="bg-[#B98237]/10 border border-[#B98237]/20"
          />

          {/* Weekly Activity Chart Panel */}
          <div className="sm:col-span-3 bg-white rounded-xl border border-[#E4E2DE] p-5 shadow-xs">
            <WeeklyActivityChart sessions={sessionsForChart} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Goal Overview + Recent Study Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Study Goals */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#24242A] uppercase tracking-wider select-none">
              Active Curricula ({goals.length})
            </h2>
            <Link
              to="/goals"
              className="text-xs font-semibold text-[#5557C8] hover:text-[#4446B4] flex items-center gap-1 transition"
            >
              <span>View All Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <EmptyState
              title="No study goals created yet"
              description="Define a technical subject or curriculum to outline topics, set prerequisites, and track your study time."
              icon={<BookOpen className="w-5 h-5 text-[#777782]" />}
              actionLabel="Create First Goal"
              onAction={() => setIsGoalModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const isMastered = g.progressPercentage === 100 && g.totalTopics > 0;
                return (
                  <Card key={g.id} className="p-4 hover:border-[#5557C8]/40">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        to={`/goals/${g.id}`}
                        className="font-semibold text-[#24242A] text-sm hover:text-[#5557C8] transition truncate max-w-md"
                      >
                        {g.title}
                      </Link>
                      <span className="text-xs font-bold text-[#24242A] tabular-nums">
                        {g.progressPercentage}%
                      </span>
                    </div>
                    <ProgressBar
                      value={g.progressPercentage}
                      size="sm"
                      variant={isMastered ? 'success' : 'default'}
                    />
                    <div className="flex items-center justify-between text-xs text-[#777782] mt-3 pt-1">
                      <span className="tabular-nums">
                        {g.completedTopics} of {g.totalTopics} topics complete
                      </span>
                      <Link
                        to={`/goals/${g.id}`}
                        className="text-[#5557C8] hover:underline font-medium text-xs inline-flex items-center gap-1"
                      >
                        <span>View Curriculum</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Study Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#24242A] uppercase tracking-wider select-none">
              Recent Study Sessions
            </h2>
            <Link
              to="/sessions"
              className="text-xs font-semibold text-[#5557C8] hover:text-[#4446B4] flex items-center gap-1 transition"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-4">
            <ActivityTimeline sessions={recentSessions} />
          </Card>
        </div>
      </div>

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />

      <SessionLogModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />
    </div>
  );
};

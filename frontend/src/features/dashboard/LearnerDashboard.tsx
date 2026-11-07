import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-zinc-600" />
        <p className="text-xs text-zinc-500 mt-3 font-medium">
          Loading learning dashboard...
        </p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-normal">
        Failed to load progress dashboard. Please try refreshing the page.
      </div>
    );
  }

  const { overview, goals, recentSessions } = progress;
  // Use all sessions for chart if available, otherwise fallback to recentSessions
  const sessionsForChart = allSessions.length > 0 ? allSessions : recentSessions;

  return (
    <div className="space-y-6">
      {/* Welcome header & primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Learner Trajectory
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-[11px] text-zinc-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track milestones, complete prerequisite chains, and maintain focused study consistency.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            leftIcon={<Compass className="w-3.5 h-3.5" />}
          >
            New Goal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSessionModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Log Session
          </Button>
        </div>
      </div>

      {/* Varied visual hierarchy for metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Progress Card (Spans 5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-zinc-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Overall Curriculum Mastery
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                <CheckCircle2 className="w-3 h-3" />
                <span>{overview.completedTopics}/{overview.totalTopics} Topics</span>
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-zinc-950 tracking-tight tabular-nums">
                {overview.completionPercentage}%
              </span>
              <span className="text-xs text-zinc-500 font-medium">cumulative completion</span>
            </div>

            <div className="mt-3">
              <ProgressBar value={overview.completionPercentage} size="md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-zinc-100 text-xs">
            <div>
              <span className="text-[11px] text-zinc-400 block font-medium">Completed Milestones</span>
              <span className="font-bold text-zinc-900 text-sm">{overview.completedTopics} topics</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block font-medium">Remaining Required</span>
              <span className="font-bold text-zinc-900 text-sm">{overview.remainingTopics} topics</span>
            </div>
          </div>
        </div>

        {/* Supporting Metric Cards (Spans 7 cols on lg) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Active Curricula"
            value={overview.totalGoals}
            subtitle={`${goals.length} curricula active`}
            icon={<Compass className="w-4 h-4 text-zinc-600" />}
            iconBgColor="bg-zinc-100"
          />

          <StatCard
            title="Total Study Time"
            value={formatMinutes(overview.totalMinutes)}
            subtitle={`${overview.totalHours} total study hours`}
            icon={<Clock className="w-4 h-4 text-blue-600" />}
            iconBgColor="bg-blue-50"
          />

          <StatCard
            title="Verified Sessions"
            value={overview.totalSessions}
            subtitle="Focused study logs"
            icon={<BookOpen className="w-4 h-4 text-emerald-600" />}
            iconBgColor="bg-emerald-50"
          />

          {/* Weekly Activity Visualization Card across the bottom of right column */}
          <div className="sm:col-span-3 bg-white rounded-lg border border-zinc-200/90 p-5 shadow-2xs">
            <WeeklyActivityChart sessions={sessionsForChart} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Curricula Progress + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Goal Progress Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Curriculum Goals ({goals.length})
            </h2>
            <Link
              to="/goals"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>View All Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <EmptyState
              title="No study goals created yet"
              description="Define a technical subject or curriculum to outline topics, set prerequisites, and track your study time."
              icon={<BookOpen className="w-5 h-5" />}
              actionLabel="Create First Goal"
              onAction={() => setIsGoalModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {goals.map((g) => (
                <Card key={g.id} className="p-4 hover:border-zinc-300">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/goals/${g.id}`}
                      className="font-semibold text-zinc-900 text-sm hover:text-blue-600 transition truncate max-w-md"
                    >
                      {g.title}
                    </Link>
                    <span className="text-xs font-bold text-zinc-800 tabular-nums">
                      {g.progressPercentage}%
                    </span>
                  </div>
                  <ProgressBar value={g.progressPercentage} size="sm" />
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-2.5 pt-1">
                    <span>
                      {g.completedTopics} of {g.totalTopics} topics complete
                    </span>
                    <Link
                      to={`/goals/${g.id}`}
                      className="text-blue-600 hover:underline font-medium text-xs inline-flex items-center gap-1"
                    >
                      <span>View Curriculum</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Study Sessions Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Recent Study Sessions
            </h2>
            <Link
              to="/sessions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>View History</span>
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

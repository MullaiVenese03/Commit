import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Clock,
  Compass,
  GraduationCap,
  Shield,
  Sliders,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useLearners } from '../../hooks/useMentor';
import { useSettings } from '../../hooks/useSettings';
import { StatCard } from '../dashboard/StatCard';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: learners = [], isLoading: isLearnersLoading } = useLearners();
  const { data: settings } = useSettings();

  if (isLearnersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-zinc-600" />
        <p className="text-xs text-zinc-500 mt-3 font-medium">
          Loading mentor dashboard...
        </p>
      </div>
    );
  }

  const totalLearners = learners.length;
  const totalCurricula = learners.reduce((sum, l) => sum + l.totalGoals, 0);
  const totalHoursTracked = Number(
    learners.reduce((sum, l) => sum + l.totalHours, 0).toFixed(1),
  );
  const avgCompletion =
    totalLearners > 0
      ? Math.round(
          learners.reduce((sum, l) => sum + l.completionPercentage, 0) /
            totalLearners,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Mentor Console</span>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-[11px] text-zinc-400">Cohort Oversight</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Oversee learner curriculum milestones, verify study consistency, and configure system policies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/mentor/settings">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              System Settings
            </Button>
          </Link>
          <Link to="/mentor/learners">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              All Learners
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Learners"
          value={totalLearners}
          subtitle="Active cohort participants"
          icon={<Users className="w-4 h-4 text-zinc-600" />}
          iconBgColor="bg-zinc-100"
        />

        <StatCard
          title="Active Curricula"
          value={totalCurricula}
          subtitle="Across all learner accounts"
          icon={<Compass className="w-4 h-4 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="Cohort Hours Studied"
          value={`${totalHoursTracked}h`}
          subtitle="Verified study time logged"
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Average Completion"
          value={`${avgCompletion}%`}
          subtitle="Cohort milestone progress"
          icon={<GraduationCap className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50"
          variant="highlight"
        />
      </div>

      {/* Main Grid: Learners Roster + System Settings Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Learners Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Learner Progress Roster ({learners.length})
            </h2>
            <Link
              to="/mentor/learners"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3">Learner</th>
                    <th scope="col" className="px-4 py-3">Curricula</th>
                    <th scope="col" className="px-4 py-3 w-1/3">Milestone Progress</th>
                    <th scope="col" className="px-4 py-3">Hours Logged</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {learners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900">{learner.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{learner.email}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                        {learner.totalGoals} goals
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar
                          value={learner.completionPercentage}
                          showValue
                          size="sm"
                          variant={learner.completionPercentage === 100 ? 'success' : 'default'}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap tabular-nums">
                        {learner.totalHours} hrs
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/mentor/learners/${learner.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: System Policy Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Enforced System Policies
            </h2>
            <Link
              to="/mentor/settings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>Edit Policies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200/80">
                <span className="text-[11px] text-zinc-500 block font-medium">Session Duration Bounds</span>
                <span className="font-bold text-zinc-900 text-sm">
                  {settings?.minSessionMinutes ?? 5} min min • {settings?.maxSessionMinutes ?? 480} min max
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Applied to all learner study session logging inputs.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200/80">
                <span className="text-[11px] text-zinc-500 block font-medium">Topic Prerequisite Cap</span>
                <span className="font-bold text-zinc-900 text-sm">
                  {settings?.maxPrerequisitesPerTopic ?? 5} prerequisites per topic
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Prevents circular or excessively complex prerequisite trees.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/mentor/settings">
                <Button variant="outline" size="sm" className="w-full">
                  Configure System Settings
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

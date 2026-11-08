import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '../../components/layout/AppLayout';
import { CommitLogo } from '../../components/ui/CommitLogo';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Lazy-loaded route views for optimized chunking and performance
const LoginPage = lazy(() => import('../../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const LearnerDashboard = lazy(() => import('../../features/dashboard/LearnerDashboard').then((m) => ({ default: m.LearnerDashboard })));
const GoalDetailPage = lazy(() => import('../../features/goals/GoalDetailPage').then((m) => ({ default: m.GoalDetailPage })));
const GoalListPage = lazy(() => import('../../features/goals/GoalListPage').then((m) => ({ default: m.GoalListPage })));
const LearnerDetailPage = lazy(() => import('../../features/mentor/LearnerDetailPage').then((m) => ({ default: m.LearnerDetailPage })));
const LearnerListPage = lazy(() => import('../../features/mentor/LearnerListPage').then((m) => ({ default: m.LearnerListPage })));
const MentorDashboard = lazy(() => import('../../features/mentor/MentorDashboard').then((m) => ({ default: m.MentorDashboard })));
const MentorGoalsPage = lazy(() => import('../../features/mentor/MentorGoalsPage').then((m) => ({ default: m.MentorGoalsPage })));
const MentorSessionsPage = lazy(() => import('../../features/mentor/MentorSessionsPage').then((m) => ({ default: m.MentorSessionsPage })));
const ProgressPage = lazy(() => import('../../features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const SessionHistoryPage = lazy(() => import('../../features/sessions/SessionHistoryPage').then((m) => ({ default: m.SessionHistoryPage })));
const SettingsPage = lazy(() => import('../../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const RouteLoading: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 min-h-[50vh] animate-in fade-in duration-100">
    <CommitLogo size="md" className="opacity-80 mb-2.5 animate-pulse" />
    <Spinner size="sm" className="text-[#5557C8]" />
    <span className="text-xs text-[#777782] mt-2 font-medium">Loading view...</span>
  </div>
);

const HomeRedirect: React.FC = () => {
  const { isMentor } = useAuth();
  return <Navigate to={isMentor ? '/mentor' : '/dashboard'} replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Root index redirect based on user role */}
              <Route index element={<HomeRedirect />} />

              {/* Accessible to both Learner and Mentor */}
              <Route path="/goals/:id" element={<GoalDetailPage />} />

              {/* Learner Exclusive Routes */}
              <Route element={<RoleRoute allowedRoles={['LEARNER']} />}>
                <Route path="/dashboard" element={<LearnerDashboard />} />
                <Route path="/goals" element={<GoalListPage />} />
                <Route path="/sessions" element={<SessionHistoryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
              </Route>

              {/* Mentor Exclusive Routes */}
              <Route element={<RoleRoute allowedRoles={['MENTOR']} />}>
                <Route path="/mentor" element={<MentorDashboard />} />
                <Route path="/mentor/learners" element={<LearnerListPage />} />
                <Route path="/mentor/learners/:learnerId" element={<LearnerDetailPage />} />
                <Route path="/mentor/goals" element={<MentorGoalsPage />} />
                <Route path="/mentor/sessions" element={<MentorSessionsPage />} />
                <Route path="/mentor/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

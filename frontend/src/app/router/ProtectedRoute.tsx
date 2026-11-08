import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { CommitLogo } from '../../components/ui/CommitLogo';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F3F0]">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-150">
          <CommitLogo size="lg" className="animate-pulse" />
          <Spinner size="sm" className="text-[#5557C8]" />
          <p className="text-xs text-[#777782] font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

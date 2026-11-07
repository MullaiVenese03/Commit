import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, isMentor } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate home page based on role
    return <Navigate to={isMentor ? '/mentor' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

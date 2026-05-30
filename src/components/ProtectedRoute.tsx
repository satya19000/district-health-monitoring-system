import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './ui/Primitives';
import { canAccessDashboard, can, type DashboardScope, type Capability } from '../lib/roles';

interface Props {
  children: React.ReactNode;
  dashboard?: DashboardScope;
  capability?: Capability;
}

export default function ProtectedRoute({ children, dashboard, capability }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Authenticating" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (dashboard && !canAccessDashboard(user.role, dashboard)) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (capability && !can(user.role, capability)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

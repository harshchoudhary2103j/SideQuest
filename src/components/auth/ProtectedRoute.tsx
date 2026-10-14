import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context';
import { LoadingIndicator } from '../ui';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  // If Supabase is not configured (running in mock mode), permit access
  if (!isConfigured) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Prevent flash of unauthorized content while restoring session
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg-main)',
        }}
      >
        <LoadingIndicator variant="spinner" size="lg" label="Restoring session..." />
      </div>
    );
  }

  // If unauthenticated, redirect to welcome page preserving intended return location
  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

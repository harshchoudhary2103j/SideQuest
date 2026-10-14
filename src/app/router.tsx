import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { ProtectedRoute } from '../components/auth';
import {
  WelcomePage,
  AuthPage,
  OnboardingPage,
  SquadPage,
  MissionsPage,
  MissionDetailPage,
  MissionResultPage,
  LorePage,
  ProfilePage,
  DesignSystemPage,
  NotFoundPage,
} from '../pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/welcome" replace />,
  },
  {
    path: '/welcome',
    element: <WelcomePage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/squad" replace />,
      },
      {
        path: 'squad',
        element: <SquadPage />,
      },
      {
        path: 'missions',
        element: <MissionsPage />,
      },
      {
        path: 'missions/:missionId',
        element: <MissionDetailPage />,
      },
      {
        path: 'missions/:missionId/result',
        element: <MissionResultPage />,
      },
      {
        path: 'lore',
        element: <LorePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'design-system',
        element: <DesignSystemPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

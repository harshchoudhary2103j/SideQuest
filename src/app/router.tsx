import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout';
import {
  WelcomePage,
  OnboardingPage,
  SquadPage,
  MissionsPage,
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
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/app',
    element: <AppShell />,
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

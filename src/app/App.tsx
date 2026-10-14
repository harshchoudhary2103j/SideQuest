import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '../components/ui';
import { AuthProvider, SquadProvider } from '../context';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <SquadProvider>
          <RouterProvider router={router} />
        </SquadProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

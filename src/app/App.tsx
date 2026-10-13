import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '../components/ui';
import { SquadProvider } from '../context';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <SquadProvider>
        <RouterProvider router={router} />
      </SquadProvider>
    </ToastProvider>
  );
};

export default App;

import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import styles from './AppShell.module.css';

export const AppShell: React.FC = () => {
  return (
    <div className={styles.shell}>
      <DesktopSidebar />
      <div className={styles.mainArea}>
        <main className={styles.contentContainer}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

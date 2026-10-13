import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Compass, BookOpen, User, Palette, Crown } from 'lucide-react';
import { MascotDisplay } from '../mascot/MascotDisplay';
import styles from './DesktopSidebar.module.css';

interface NavRoute {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavRoute[] = [
  { path: '/app/squad', label: 'Squad Home', icon: Shield },
  { path: '/app/missions', label: 'Missions', icon: Compass },
  { path: '/app/lore', label: 'Squad Lore', icon: BookOpen },
  { path: '/app/profile', label: 'Profile', icon: User },
  { path: '/app/design-system', label: 'Design System', icon: Palette },
];

export const DesktopSidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar} aria-label="Desktop Navigation">
      <NavLink to="/app/squad" className={styles.brand}>
        <div className={styles.brandIcon}>
          <Crown size={20} color="#FFC857" />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>SideQuest</span>
          <span className={styles.brandTagline}>Same friends. New adventures.</span>
        </div>
      </NavLink>

      <nav className={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Squad Mascot Status Pill */}
      <div className={styles.squadMiniCard}>
        <div className={styles.mascotThumb}>
          <MascotDisplay expression="excited" size="small" animation="idle" />
        </div>
        <div className={styles.squadInfo}>
          <span className={styles.squadName}>Chaos Squad</span>
          <span className={styles.squadStats}>★ Lv.1 Star Pup • 150 XP</span>
        </div>
      </div>
    </aside>
  );
};

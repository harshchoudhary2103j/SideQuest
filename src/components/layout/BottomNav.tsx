import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Compass, BookOpen, User, Palette } from 'lucide-react';
import styles from './BottomNav.module.css';

interface NavRoute {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavRoute[] = [
  { path: '/app/squad', label: 'Squad', icon: Shield },
  { path: '/app/missions', label: 'Missions', icon: Compass },
  { path: '/app/lore', label: 'Lore', icon: BookOpen },
  { path: '/app/profile', label: 'Profile', icon: User },
  { path: '/app/design-system', label: 'Tokens', icon: Palette },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className={styles.nav} aria-label="Mobile Navigation">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className={styles.activeIndicator} />}
                <div className={styles.iconWrap}>
                  <IconComponent size={20} />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

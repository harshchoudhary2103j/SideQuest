import React from 'react';
import styles from './PageHeading.module.css';

export interface PageHeadingProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'h1' | 'h2';
  className?: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  badge,
  actions,
  as: Component = 'h1',
  className = '',
}) => {
  return (
    <header className={`${styles.container} ${className}`}>
      <div className={styles.textGroup}>
        {badge && <div className={styles.badgeRow}>{badge}</div>}
        <Component className={styles.title}>{title}</Component>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actionsWrap}>{actions}</div>}
    </header>
  );
};

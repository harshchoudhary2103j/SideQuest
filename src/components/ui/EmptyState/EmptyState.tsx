import React from 'react';
import { MascotDisplay } from '../../mascot/MascotDisplay';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  description: string;
  visual?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  visual,
  action,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.visualWrap}>
        {visual || <MascotDisplay expression="sleepy" size="medium" animation="idle" />}
      </div>
      <div className={styles.textGroup}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      {action && <div className={styles.actionWrap}>{action}</div>}
    </div>
  );
};

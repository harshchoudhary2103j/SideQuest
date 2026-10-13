import React from 'react';
import styles from './LoadingIndicator.module.css';

export interface LoadingIndicatorProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  color?: 'lime' | 'purple' | 'white';
  label?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'lime',
  label = 'Loading...',
  className = '',
}) => {
  const colorClass =
    color === 'purple'
      ? styles.colorPurple
      : color === 'white'
      ? styles.colorWhite
      : styles.colorLime;

  return (
    <div
      className={`${styles.container} ${colorClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      {variant === 'spinner' && (
        <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      )}

      {variant === 'dots' && (
        <span className={`${styles.dotsWrap} ${styles[size]}`} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      )}

      {variant === 'pulse' && (
        <span className={`${styles.pulseCircle} ${styles[size]}`} aria-hidden="true" />
      )}

      <span className="sr-only">{label}</span>
    </div>
  );
};

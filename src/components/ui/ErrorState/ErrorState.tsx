import React from 'react';
import { MascotDisplay } from '../../mascot/MascotDisplay';
import { Button } from '../Button/Button';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  visual?: React.ReactNode;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Chaos in the Portal!',
  description = 'Something went sideways while fetching squad updates. Let’s try again.',
  visual,
  onRetry,
  retryText = 'Try Again',
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`} role="alert">
      <div className={styles.visualWrap}>
        {visual || <MascotDisplay expression="sad" size="medium" animation="idle" />}
      </div>
      <div className={styles.textGroup}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      {onRetry && (
        <div className={styles.actionWrap}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};

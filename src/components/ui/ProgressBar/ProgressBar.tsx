import React from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'lime' | 'purple' | 'gold' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'lime',
  size = 'md',
  animated = false,
  className = '',
  ...props
}) => {
  const safeMax = Math.max(1, max);
  const clampedValue = Math.min(Math.max(0, value), safeMax);
  const percentage = Math.round((clampedValue / safeMax) * 100);

  const fillClass =
    variant === 'purple'
      ? styles.purpleFill
      : variant === 'gold'
      ? styles.goldFill
      : variant === 'gradient'
      ? styles.gradientFill
      : styles.limeFill;

  const containerClasses = [
    styles.container,
    styles[size],
    animated ? styles.animated : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} {...props}>
      {(label || showValue) && (
        <div className={styles.labelRow}>
          {label && <span>{label}</span>}
          {showValue && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progress'}
      >
        <div
          className={`${styles.fill} ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

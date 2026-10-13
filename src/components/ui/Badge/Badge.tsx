import React from 'react';
import type { BadgeVariant, BadgeSize } from '../../../types';
import styles from './Badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'lime',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};

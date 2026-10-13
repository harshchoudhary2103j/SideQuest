import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  style,
  className = '',
  ...props
}) => {
  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  const classNames = [
    styles.skeleton,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
};

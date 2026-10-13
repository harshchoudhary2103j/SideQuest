import React from 'react';
import type { ButtonVariant, ButtonSize } from '../../../types';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={classNames}
        {...props}
      >
        {isLoading && (
          <span className={styles.spinnerOverlay} aria-hidden="true">
            <span className={styles.spinner} />
          </span>
        )}
        <span
          className={isLoading ? styles.contentHidden : undefined}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

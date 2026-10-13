import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={generatedId} className={styles.label}>
            {label}
            {required && <span className={styles.requiredStar}>*</span>}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={generatedId}
            required={required}
            className={[
              styles.input,
              error ? styles.inputError : '',
              leftIcon ? styles.hasLeftIcon : '',
              rightIcon ? styles.hasRightIcon : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${generatedId}-error`
                : helperText
                ? `${generatedId}-helper`
                : undefined
            }
            {...props}
          />
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>

        {error && (
          <span id={`${generatedId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={`${generatedId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

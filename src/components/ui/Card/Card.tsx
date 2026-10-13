import React from 'react';
import styles from './Card.module.css';

export type CardVariant = 'standard' | 'raised' | 'interactive' | 'featured';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  padding = 'md',
  as: Component = 'div',
  className = '',
  ...props
}) => {
  const padClass =
    padding === 'none'
      ? styles.padNone
      : padding === 'sm'
      ? styles.padSm
      : padding === 'lg'
      ? styles.padLg
      : styles.padMd;

  const classNames = [
    styles.card,
    styles[variant],
    padClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.header} ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`${styles.title} ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`${styles.description} ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.content} ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.footer} ${className}`} {...props}>
    {children}
  </div>
);

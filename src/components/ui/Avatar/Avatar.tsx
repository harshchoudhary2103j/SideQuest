import React, { useState } from 'react';
import type { AvatarSize, AvatarStatus, AvatarRing } from '../../../types';
import styles from './Avatar.module.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  ring?: AvatarRing;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  ring = 'none',
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute initials from name
  const getInitials = (str: string) => {
    if (!str) return 'SQ';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const ringClass =
    ring === 'lime'
      ? styles.ringLime
      : ring === 'purple'
      ? styles.ringPurple
      : ring === 'gold'
      ? styles.ringGold
      : '';

  const classNames = [
    styles.avatarContainer,
    styles[size],
    ringClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={styles.fallback} aria-label={alt || name}>
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`${styles.statusBadge} ${
            status === 'online'
              ? styles.statusOnline
              : status === 'busy'
              ? styles.statusBusy
              : styles.statusOffline
          }`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

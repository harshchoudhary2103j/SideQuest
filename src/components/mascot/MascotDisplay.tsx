import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { TargetAndTransition, Transition } from 'framer-motion';
import type { MascotDisplayProps } from '../../types/mascot';
import { resolveMascotAssetUrl, getEvolutionStageInfo } from './mascotRegistry';
import { MascotVectorFallback } from './MascotVectorFallback';
import styles from './MascotDisplay.module.css';

export const MascotDisplay: React.FC<MascotDisplayProps> = ({
  expression = 'happy',
  evolutionLevel = 1,
  pose,
  size = 'medium',
  animation = 'idle',
  alt,
  speechBubble,
  className = '',
  showStageBadge = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Asset URL from central registry
  const assetUrl = resolveMascotAssetUrl({
    expression,
    evolutionLevel,
    pose,
  });

  const stageInfo = getEvolutionStageInfo(evolutionLevel);
  const accessibleLabel =
    alt || `Questy the Stardust Creature, ${stageInfo.name} (Level ${evolutionLevel}), feeling ${expression}`;

  // Size class resolution
  const sizeClass =
    size === 'small'
      ? styles.sizeSmall
      : size === 'large'
      ? styles.sizeLarge
      : styles.sizeMedium;

  // Animation variants
  const getAnimationProps = (): {
    animate?: TargetAndTransition;
    transition?: Transition;
  } => {
    if (shouldReduceMotion || animation === 'none') {
      return {};
    }

    switch (animation) {
      case 'celebrate':
        return {
          animate: {
            y: [0, -14, 0, -8, 0],
            scale: [1, 1.08, 0.98, 1.03, 1],
            rotate: [0, -3, 3, -2, 0],
          },
          transition: {
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: 'easeInOut',
          },
        };
      case 'float':
        return {
          animate: {
            y: [0, -10, 0],
            rotate: [-1.5, 1.5, -1.5],
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'think':
        return {
          animate: {
            rotate: [0, -6, 0],
            scale: [1, 0.98, 1],
          },
          transition: {
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'idle':
      default:
        return {
          animate: {
            y: [0, -6, 0],
          },
          transition: {
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
    }
  };

  return (
    <div className={`${styles.container} ${sizeClass} ${className}`}>
      {speechBubble && (
        <div className={styles.speechBubble} role="status">
          {speechBubble}
        </div>
      )}

      <motion.div
        className={styles.mascotWrap}
        {...getAnimationProps()}
      >
        {/*
          Graceful Loading & Asset Strategy:
          If a production .webp image is confirmed in public/assets/mascot/, assetUrl is non-null and it displays it.
          If assetUrl is null (no raster file exists yet) or imageError occurs, MascotVectorFallback renders directly.
        */}
        {assetUrl && !imageError ? (
          <>
            <img
              src={assetUrl}
              alt={accessibleLabel}
              className={styles.mascotImage}
              style={{ display: imageLoaded ? 'block' : 'none' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {!imageLoaded && (
              <div className={styles.vectorWrap}>
                <MascotVectorFallback
                  expression={expression}
                  evolutionLevel={evolutionLevel}
                  pose={pose}
                  size={size}
                  alt={accessibleLabel}
                />
              </div>
            )}
          </>
        ) : (
          <div className={styles.vectorWrap}>
            <MascotVectorFallback
              expression={expression}
              evolutionLevel={evolutionLevel}
              pose={pose}
              size={size}
              alt={accessibleLabel}
            />
          </div>
        )}
      </motion.div>

      {showStageBadge && (
        <div className={styles.stageBadge}>
          <span>★ Lv.{evolutionLevel}</span>
          <span>{stageInfo.name}</span>
        </div>
      )}
    </div>
  );
};

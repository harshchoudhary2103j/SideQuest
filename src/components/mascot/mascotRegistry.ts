/**
 * Centralized Typed Mascot Asset Registry & Evolution Metadata
 * All mascot paths and stage descriptions are managed here.
 */

import type {
  MascotExpression,
  MascotEvolutionLevel,
  MascotPose,
  EvolutionStageInfo,
} from '../../types/mascot';

export const EVOLUTION_STAGES: Record<MascotEvolutionLevel, EvolutionStageInfo> = {
  1: {
    level: 1,
    name: 'Star Pup',
    tagline: 'Just a spark of chaos.',
    description: 'A tiny, curious stardust pup discovering the world with its squad.',
  },
  2: {
    level: 2,
    name: 'Glow Buddy',
    tagline: 'Finding its vibe.',
    description: 'Sprouting a brighter star charm and a glowing explorer pack.',
  },
  3: {
    level: 3,
    name: 'Quest Pal',
    tagline: 'Always up for trouble.',
    description: 'Brimming with chaotic gaming energy, ready for any spontaneous quest.',
  },
  4: {
    level: 4,
    name: 'Star Guardian',
    tagline: 'Leading the chaos.',
    description: 'Adorned with starry galactic pauldrons and guiding squad missions.',
  },
  5: {
    level: 5,
    name: 'Legendary Questy',
    tagline: "Your squad's icon.",
    description: 'Ascended to legendary status with cosmic wings and an ethereal crown.',
  },
};

export const MASCOT_ASSET_PATHS = {
  base: '/assets/mascot/base.webp',
  expressions: {
    happy: '/assets/mascot/expressions/happy.webp',
    excited: '/assets/mascot/expressions/excited.webp',
    mischievous: '/assets/mascot/expressions/mischievous.webp',
    surprised: '/assets/mascot/expressions/surprised.webp',
    sleepy: '/assets/mascot/expressions/sleepy.webp',
    proud: '/assets/mascot/expressions/proud.webp',
    sad: '/assets/mascot/expressions/sad.webp',
    angry: '/assets/mascot/expressions/angry.webp',
  } as Record<MascotExpression, string>,
  evolution: {
    1: '/assets/mascot/evolution/level-1.webp',
    2: '/assets/mascot/evolution/level-2.webp',
    3: '/assets/mascot/evolution/level-3.webp',
    4: '/assets/mascot/evolution/level-4.webp',
    5: '/assets/mascot/evolution/level-5.webp',
  } as Record<MascotEvolutionLevel, string>,
  poses: {
    jump: '/assets/mascot/poses/jump.webp',
    float: '/assets/mascot/poses/float.webp',
    wave: '/assets/mascot/poses/wave.webp',
    celebrate: '/assets/mascot/poses/celebrate.webp',
    sit: '/assets/mascot/poses/sit.webp',
    think: '/assets/mascot/poses/think.webp',
  } as Record<MascotPose, string>,
};

/**
 * Set of raster assets confirmed to exist in public/assets/mascot/.
 * Initially empty until production 3D/raster webp exports are added to public/assets/mascot/.
 * This guarantees we never attempt to fetch a nonexistent file or emit 404 console errors.
 */
export const AVAILABLE_RASTER_ASSETS = new Set<string>();

/**
 * Resolves the candidate asset URL for the given configuration if a raster file exists.
 * Returns null if no raster file exists, triggering the high-fidelity vector fallback directly.
 */
export function resolveMascotAssetUrl(options: {
  expression?: MascotExpression;
  evolutionLevel?: MascotEvolutionLevel;
  pose?: MascotPose;
}): string | null {
  let candidate: string | null = null;
  if (options.pose && MASCOT_ASSET_PATHS.poses[options.pose]) {
    candidate = MASCOT_ASSET_PATHS.poses[options.pose];
  } else if (options.expression && MASCOT_ASSET_PATHS.expressions[options.expression]) {
    candidate = MASCOT_ASSET_PATHS.expressions[options.expression];
  } else if (options.evolutionLevel && MASCOT_ASSET_PATHS.evolution[options.evolutionLevel]) {
    candidate = MASCOT_ASSET_PATHS.evolution[options.evolutionLevel];
  } else {
    candidate = MASCOT_ASSET_PATHS.base;
  }

  return candidate && AVAILABLE_RASTER_ASSETS.has(candidate) ? candidate : null;
}

export function getEvolutionStageInfo(level: MascotEvolutionLevel): EvolutionStageInfo {
  return EVOLUTION_STAGES[level] || EVOLUTION_STAGES[1];
}

/**
 * Authoritative progression and milestone configuration.
 * Consistent with PostgreSQL GREATEST(1, FLOOR(xp / 300) + 1).
 */
export const STAGE_XP_THRESHOLDS: Record<MascotEvolutionLevel, number> = {
  1: 0,
  2: 300,
  3: 600,
  4: 900,
  5: 1200,
};

export const STAGE_LEVEL_THRESHOLDS: Record<MascotEvolutionLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

export function deriveLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 300) + 1);
}

export function deriveEvolutionStageFromLevel(level: number): MascotEvolutionLevel {
  return Math.min(5, Math.max(1, level)) as MascotEvolutionLevel;
}

export interface NextEvolutionMilestone {
  nextStage: MascotEvolutionLevel | null;
  nextStageInfo: EvolutionStageInfo | null;
  xpRequired: number;
  xpRemaining: number;
  levelRequired: number;
  isMaxEvolution: boolean;
  progressPercent: number;
}

export function calculateNextEvolution(currentLevel: number, currentXp: number): NextEvolutionMilestone {
  const currentStage = deriveEvolutionStageFromLevel(currentLevel);
  if (currentStage >= 5) {
    return {
      nextStage: null,
      nextStageInfo: null,
      xpRequired: 1200,
      xpRemaining: 0,
      levelRequired: 5,
      isMaxEvolution: true,
      progressPercent: 100,
    };
  }

  const nextStage = (currentStage + 1) as MascotEvolutionLevel;
  const currentStageXp = STAGE_XP_THRESHOLDS[currentStage];
  const nextStageXp = STAGE_XP_THRESHOLDS[nextStage];
  const xpNeeded = nextStageXp - currentStageXp;
  const xpIntoStage = Math.max(0, currentXp - currentStageXp);
  const xpRemaining = Math.max(0, nextStageXp - currentXp);
  const progressPercent = Math.min(100, Math.floor((xpIntoStage / xpNeeded) * 100));

  return {
    nextStage,
    nextStageInfo: EVOLUTION_STAGES[nextStage],
    xpRequired: nextStageXp,
    xpRemaining,
    levelRequired: STAGE_LEVEL_THRESHOLDS[nextStage],
    isMaxEvolution: false,
    progressPercent,
  };
}

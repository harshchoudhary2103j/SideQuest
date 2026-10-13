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
 * Resolves the candidate asset URL for the given configuration.
 */
export function resolveMascotAssetUrl(options: {
  expression?: MascotExpression;
  evolutionLevel?: MascotEvolutionLevel;
  pose?: MascotPose;
}): string {
  if (options.pose && MASCOT_ASSET_PATHS.poses[options.pose]) {
    return MASCOT_ASSET_PATHS.poses[options.pose];
  }
  if (options.expression && MASCOT_ASSET_PATHS.expressions[options.expression]) {
    return MASCOT_ASSET_PATHS.expressions[options.expression];
  }
  if (options.evolutionLevel && MASCOT_ASSET_PATHS.evolution[options.evolutionLevel]) {
    return MASCOT_ASSET_PATHS.evolution[options.evolutionLevel];
  }
  return MASCOT_ASSET_PATHS.base;
}

export function getEvolutionStageInfo(level: MascotEvolutionLevel): EvolutionStageInfo {
  return EVOLUTION_STAGES[level] || EVOLUTION_STAGES[1];
}

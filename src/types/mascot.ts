/**
 * SideQuest Mascot (Questy) Types
 */

export type MascotExpression =
  | 'happy'
  | 'excited'
  | 'mischievous'
  | 'surprised'
  | 'sleepy'
  | 'proud'
  | 'sad'
  | 'angry';

export type MascotPose =
  | 'jump'
  | 'float'
  | 'wave'
  | 'celebrate'
  | 'sit'
  | 'think';

export type MascotEvolutionLevel = 1 | 2 | 3 | 4 | 5;

export type MascotAnimation =
  | 'idle'
  | 'celebrate'
  | 'float'
  | 'think'
  | 'none';

export type MascotSize = 'small' | 'medium' | 'large';

export interface EvolutionStageInfo {
  level: MascotEvolutionLevel;
  name: string;
  tagline: string;
  description: string;
}

export interface MascotDisplayProps {
  expression?: MascotExpression;
  evolutionLevel?: MascotEvolutionLevel;
  pose?: MascotPose;
  size?: MascotSize;
  animation?: MascotAnimation;
  alt?: string;
  speechBubble?: string;
  className?: string;
  showStageBadge?: boolean;
}

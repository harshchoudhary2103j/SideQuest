import type { MascotEvolutionLevel } from './mascot';

export interface SquadMember {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarRing: 'lime' | 'purple' | 'gold' | 'none';
  status: 'online' | 'busy' | 'offline';
  completedMissions: number;
  personalXp: number;
  isCurrentUser?: boolean;
}

export interface ActivityEvent {
  id: string;
  memberId: string;
  memberName: string;
  type: 'proof_submitted' | 'mission_started' | 'reaction_added' | 'streak_milestone';
  content: string;
  timeAgo: string;
  xpEarned?: number;
}

export type LoreCategory = 'all' | 'missions' | 'milestones' | 'chaos';

export interface LoreItem {
  id: string;
  title: string;
  category: 'missions' | 'milestones' | 'chaos';
  date: string;
  submitterName: string;
  caption: string;
  questyComment: string;
  xpAwarded: number;
  imageUrl?: string;
  fallbackIcon?: string;
  likesCount: number;
  commentsCount: number;
}

export interface Squad {
  id: string;
  name: string;
  motto: string;
  inviteCode: string;
  level: number;
  evolutionLevel: MascotEvolutionLevel;
  currentXp: number;
  targetXp: number;
  streakDays: number;
  members: SquadMember[];
}

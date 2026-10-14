export * from './mascot';
export * from './mission';
export * from './squad';
export * from './auth';
export type {
  Database,
  SquadRole,
  MissionDefinitionStatus,
  AssignmentStatus,
  ProofType,
  SubmissionStatus,
  LoreEventType,
} from './database';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'lime' | 'purple' | 'pink' | 'gold' | 'success' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'busy' | 'offline';
export type AvatarRing = 'none' | 'lime' | 'purple' | 'gold';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

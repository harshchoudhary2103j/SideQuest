import type { MascotExpression } from './mascot';

export type MissionCategory = 'exploration' | 'creative' | 'social' | 'chaos';
export type MissionDifficulty = 'easy' | 'medium' | 'hard';
export type MissionStatus = 'available' | 'in_progress' | 'submitted' | 'completed' | 'expired';
export type SubmissionType = 'photo' | 'video' | 'voice' | 'text';

export interface SquadMemberSubmission {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  submittedAt: string;
  type: SubmissionType;
  mediaUrl?: string;
  caption?: string;
  reactionsCount?: number;
  status?: 'submitted' | 'approved' | 'rejected' | 'flagged';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  isCurrentUser?: boolean;
}

export interface Mission {
  id: string;
  assignmentId?: string;
  missionId?: string;
  assignedDate?: string;
  title: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  xpReward: number;
  durationHours: number;
  deadlineText: string;
  description: string;
  rules: string[];
  submissionRequirements: string[];
  allowedTypes: SubmissionType[];
  status: MissionStatus;
  briefingExpression: MascotExpression;
  briefingSpeech: string;
  resultExpression: MascotExpression;
  resultReaction: string;
  squadSubmissions: SquadMemberSubmission[];
}

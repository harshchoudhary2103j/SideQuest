import { createContext } from 'react';
import type { Squad, Mission, ActivityEvent, LoreItem, SubmissionType } from '../types';

export interface SubmitProofOptions {
  type: SubmissionType;
  caption?: string;
  file?: File | null;
  mediaUrl?: string;
}

export interface SubmitProofResult {
  success: boolean;
  submissionId?: string;
  signedUrl?: string;
  error?: string;
}

export interface ReviewSubmissionResult {
  success: boolean;
  decision?: 'approved' | 'rejected';
  error?: string;
  xpAwarded?: number;
  newTotalXp?: number;
  newLevel?: number;
}

export interface SquadContextValue {
  squad: Squad;
  missions: Mission[];
  activity: ActivityEvent[];
  lore: LoreItem[];
  hasSquad: boolean;
  isLoadingSquad: boolean;
  isLoadingMissions: boolean;
  missionsError: string | null;
  getMissionById: (id: string) => Mission | undefined;
  refreshDailyMissions: () => Promise<void>;
  submitMissionProof: (
    missionId: string,
    proof: SubmitProofOptions
  ) => Promise<SubmitProofResult>;
  reviewSubmission: (
    submissionId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string
  ) => Promise<ReviewSubmissionResult>;
  getSignedProofUrl: (storagePath: string) => Promise<string | null>;
  createOrJoinSquad: (options: {
    userName: string;
    squadName?: string;
    inviteCode?: string;
    isCreating: boolean;
  }) => Promise<{ success: boolean; error?: string; squadId?: string }>;
  petQuesty: () => number;
  refreshSquad: () => Promise<void>;
}

export const SquadContext = createContext<SquadContextValue | undefined>(undefined);

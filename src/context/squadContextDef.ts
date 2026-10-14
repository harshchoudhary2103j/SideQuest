import { createContext } from 'react';
import type { Squad, Mission, ActivityEvent, LoreItem, SubmissionType } from '../types';

export interface SquadContextValue {
  squad: Squad;
  missions: Mission[];
  activity: ActivityEvent[];
  lore: LoreItem[];
  hasSquad: boolean;
  isLoadingSquad: boolean;
  getMissionById: (id: string) => Mission | undefined;
  submitMissionProof: (
    missionId: string,
    proof: {
      type: SubmissionType;
      caption?: string;
      mediaUrl?: string;
    }
  ) => { xpGained: number; isEvolution: boolean };
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

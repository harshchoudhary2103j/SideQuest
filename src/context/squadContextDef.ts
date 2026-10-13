import { createContext } from 'react';
import type { Squad, Mission, ActivityEvent, LoreItem, SubmissionType } from '../types';

export interface SquadContextValue {
  squad: Squad;
  missions: Mission[];
  activity: ActivityEvent[];
  lore: LoreItem[];
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
  }) => void;
  petQuesty: () => number;
}

export const SquadContext = createContext<SquadContextValue | undefined>(undefined);

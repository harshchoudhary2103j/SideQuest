import React, { useState, useCallback } from 'react';
import type { Squad, Mission, ActivityEvent, LoreItem, SubmissionType } from '../types';
import {
  INITIAL_SQUAD,
  INITIAL_MISSIONS,
  INITIAL_ACTIVITY,
  INITIAL_LORE,
} from '../lib/mockData';
import { SquadContext } from './squadContextDef';

export const SquadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [squad, setSquad] = useState<Squad>(INITIAL_SQUAD);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [activity, setActivity] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
  const [lore, setLore] = useState<LoreItem[]>(INITIAL_LORE);

  const getMissionById = useCallback(
    (id: string) => missions.find((m) => m.id === id),
    [missions]
  );

  const petQuesty = useCallback(() => {
    setSquad((prev) => ({
      ...prev,
      currentXp: Math.min(prev.currentXp + 5, prev.targetXp + 100),
    }));
    return 5;
  }, []);

  const submitMissionProof = useCallback(
    (
      missionId: string,
      proof: {
        type: SubmissionType;
        caption?: string;
        mediaUrl?: string;
      }
    ) => {
      const targetMission = missions.find((m) => m.id === missionId);
      const xpGained = targetMission ? targetMission.xpReward : 100;

      // 1. Update Mission
      const newSubmission = {
        id: `sub-${Date.now()}`,
        memberId: 'mem-1',
        memberName: 'Alex Thorne',
        submittedAt: 'Just now',
        type: proof.type,
        caption: proof.caption || 'Submitted mission proof with squad hand sign!',
        mediaUrl: proof.mediaUrl,
        reactionsCount: 0,
      };

      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId
            ? {
                ...m,
                status: 'submitted',
                squadSubmissions: [newSubmission, ...m.squadSubmissions],
              }
            : m
        )
      );

      // 2. Update Squad XP & check evolution
      let evolved = false;
      setSquad((prev) => {
        const nextXp = prev.currentXp + xpGained;
        let nextEvolution = prev.evolutionLevel;
        if (nextXp >= prev.targetXp && prev.evolutionLevel < 5) {
          nextEvolution = (prev.evolutionLevel + 1) as 1 | 2 | 3 | 4 | 5;
          evolved = true;
        }

        const updatedMembers = prev.members.map((mem) =>
          mem.isCurrentUser
            ? {
                ...mem,
                personalXp: mem.personalXp + xpGained,
                completedMissions: mem.completedMissions + 1,
              }
            : mem
        );

        return {
          ...prev,
          currentXp: nextXp,
          evolutionLevel: nextEvolution,
          members: updatedMembers,
        };
      });

      // 3. Add to Lore Items
      const newLoreItem: LoreItem = {
        id: `lore-${Date.now()}`,
        title: targetMission ? targetMission.title : 'Mission Accomplished',
        category: 'missions',
        date: 'Today',
        submitterName: 'Alex Thorne',
        caption: proof.caption || 'Mission successfully completed by the squad!',
        questyComment: '“Legendary proof! +100 XP added to our vault! 💜”',
        xpAwarded: xpGained,
        imageUrl: proof.mediaUrl,
        fallbackIcon: '📸',
        likesCount: 1,
        commentsCount: 0,
      };
      setLore((prev) => [newLoreItem, ...prev]);

      // 4. Add to Activity Stream
      const newActivity: ActivityEvent = {
        id: `act-${Date.now()}`,
        memberId: 'mem-1',
        memberName: 'Alex Thorne',
        type: 'proof_submitted',
        content: `submitted proof for "${targetMission ? targetMission.title : 'Mission'}"`,
        timeAgo: 'Just now',
        xpEarned: xpGained,
      };
      setActivity((prev) => [newActivity, ...prev]);

      return { xpGained, isEvolution: evolved };
    },
    [missions]
  );

  const createOrJoinSquad = useCallback(
    ({
      userName,
      squadName,
      inviteCode,
      isCreating,
    }: {
      userName: string;
      squadName?: string;
      inviteCode?: string;
      isCreating: boolean;
    }) => {
      setSquad((prev) => {
        const updatedUser = {
          ...prev.members[0],
          name: userName || 'Alex Thorne',
        };

        return {
          ...prev,
          name: isCreating && squadName ? squadName : prev.name,
          inviteCode: isCreating
            ? `CHAOS-${Math.floor(1000 + Math.random() * 9000)}`
            : inviteCode || prev.inviteCode,
          members: [updatedUser, ...prev.members.slice(1)],
        };
      });
    },
    []
  );

  return (
    <SquadContext.Provider
      value={{
        squad,
        missions,
        activity,
        lore,
        getMissionById,
        submitMissionProof,
        createOrJoinSquad,
        petQuesty,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
};

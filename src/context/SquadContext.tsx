import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Squad, SquadMember, Mission, ActivityEvent, LoreItem, SubmissionType, MascotEvolutionLevel } from '../types';
import {
  INITIAL_SQUAD,
  INITIAL_MISSIONS,
  INITIAL_ACTIVITY,
  INITIAL_LORE,
} from '../lib/mockData';
import { SquadContext } from './squadContextDef';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SquadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [squad, setSquad] = useState<Squad>(INITIAL_SQUAD);
  const [hasSquad, setHasSquad] = useState<boolean>(false);
  const [isLoadingSquad, setIsLoadingSquad] = useState<boolean>(false);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [activity, setActivity] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
  const [lore, setLore] = useState<LoreItem[]>(INITIAL_LORE);

  const isFetchingSquad = useRef(false);

  // Load real squad & roster for authenticated user
  const loadRealSquad = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured || isFetchingSquad.current) return;
    isFetchingSquad.current = true;
    setIsLoadingSquad(true);

    try {
      // 1. Fetch user's squad memberships
      const { data: memberships, error: memError } = await supabase
        .from('squad_memberships')
        .select('id, squad_id, role, joined_at')
        .eq('user_id', userId);

      if (memError) {
        console.warn('[SquadContext] Error loading squad memberships:', memError.message);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setHasSquad(false);
        return;
      }

      const activeMembership = memberships[0];
      const targetSquadId = activeMembership.squad_id;

      // 2. Fetch squad record
      const { data: squadData, error: squadError } = await supabase
        .from('squads')
        .select('*')
        .eq('id', targetSquadId)
        .single();

      if (squadError || !squadData) {
        console.warn('[SquadContext] Error loading squad record:', squadError?.message);
        return;
      }

      // 3. Fetch progression
      const { data: progData } = await supabase
        .from('squad_progression')
        .select('*')
        .eq('squad_id', targetSquadId)
        .maybeSingle();

      // 4. Fetch all members in squad
      const { data: allMemberships } = await supabase
        .from('squad_memberships')
        .select('id, user_id, role, joined_at')
        .eq('squad_id', targetSquadId);

      const memberUserIds = allMemberships?.map((m) => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberUserIds);

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      const squadMembers: SquadMember[] = (allMemberships || []).map((m) => {
        const p = profilesMap.get(m.user_id);
        const isCurrent = m.user_id === userId;
        const displayName = p?.display_name || (isCurrent ? (profile?.display_name || 'Adventurer') : 'Teammate');
        const aura = p?.aura || 'midnight_rebel';

        let avatarRing: 'lime' | 'purple' | 'gold' | 'none' = 'purple';
        if (aura === 'neon_goblin') avatarRing = 'lime';
        else if (aura === 'solar_paladin') avatarRing = 'gold';

        return {
          id: m.id,
          name: displayName,
          handle: '@' + displayName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          role: m.role === 'owner' ? 'Squad Founder' : m.role === 'admin' ? 'Squad Admin' : 'Squad Member',
          avatarRing,
          status: 'online',
          completedMissions: 0,
          personalXp: 0,
          isCurrentUser: isCurrent,
        };
      });

      const currentStage = Math.min(Math.max(progData?.current_evolution_stage || 1, 1), 5) as MascotEvolutionLevel;
      const currentLevel = progData?.level || 1;

      const loadedSquad: Squad = {
        id: squadData.id,
        name: squadData.name,
        motto: squadData.motto || 'Always up for spontaneous trouble.',
        inviteCode: squadData.invite_code,
        level: currentLevel,
        evolutionLevel: currentStage,
        currentXp: progData?.xp || 0,
        targetXp: currentLevel * 300,
        streakDays: progData?.streak_days || 0,
        members: squadMembers.length > 0 ? squadMembers : INITIAL_SQUAD.members,
      };

      setSquad(loadedSquad);
      setHasSquad(true);
    } catch (err) {
      console.warn('[SquadContext] Unexpected error loading squad:', err);
    } finally {
      setIsLoadingSquad(false);
      isFetchingSquad.current = false;
    }
  }, [profile]);

  useEffect(() => {
    let ignore = false;
    if (user) {
      const runLoad = async () => {
        if (!ignore) {
          await loadRealSquad(user.id);
        }
      };
      runLoad();
    } else {
      queueMicrotask(() => {
        if (!ignore) {
          setHasSquad(false);
          setSquad(INITIAL_SQUAD);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [user, loadRealSquad]);

  const refreshSquad = useCallback(async () => {
    if (user) {
      await loadRealSquad(user.id);
    }
  }, [user, loadRealSquad]);

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
      const currentUserName = profile?.display_name || squad.members.find((m) => m.isCurrentUser)?.name || 'Adventurer';

      // 1. Update Mission
      const newSubmission = {
        id: `sub-${Date.now()}`,
        memberId: user?.id || 'mem-1',
        memberName: currentUserName,
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
          nextEvolution = (prev.evolutionLevel + 1) as MascotEvolutionLevel;
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
        submitterName: currentUserName,
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
        memberId: user?.id || 'mem-1',
        memberName: currentUserName,
        type: 'proof_submitted',
        content: `submitted proof for "${targetMission ? targetMission.title : 'Mission'}"`,
        timeAgo: 'Just now',
        xpEarned: xpGained,
      };
      setActivity((prev) => [newActivity, ...prev]);

      return { xpGained, isEvolution: evolved };
    },
    [missions, user, profile, squad.members]
  );

  const createOrJoinSquad = useCallback(
    async ({
      userName,
      squadName,
      inviteCode,
      isCreating,
    }: {
      userName: string;
      squadName?: string;
      inviteCode?: string;
      isCreating: boolean;
    }): Promise<{ success: boolean; error?: string; squadId?: string }> => {
      // 1. If user is authenticated and Supabase is configured, execute real database mutations
      if (user && isSupabaseConfigured) {
        try {
          if (isCreating) {
            if (!squadName?.trim()) {
              return { success: false, error: 'Squad name is required.' };
            }

            // Generate clean invite code (e.g. CHAOS-1234)
            const cleanPrefix = squadName
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')
              .slice(0, 5) || 'SQUAD';
            const randomCode = `${cleanPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

            const { data: newSquad, error: createError } = await supabase
              .from('squads')
              .insert({
                name: squadName.trim(),
                invite_code: randomCode,
                created_by: user.id,
              })
              .select()
              .single();

            if (createError) {
              return { success: false, error: createError.message };
            }

            // Database trigger on_squad_created atomically creates owner membership and progression
            await loadRealSquad(user.id);
            return { success: true, squadId: newSquad.id };
          } else {
            // Joining squad via invite code
            if (!inviteCode?.trim()) {
              return { success: false, error: 'Invite code is required.' };
            }

            const cleanCode = inviteCode.trim().toUpperCase();
            const { data: targetSquadId, error: joinError } = await supabase.rpc(
              'join_squad_with_code',
              { code: cleanCode }
            );

            if (joinError) {
              const friendlyMessage = joinError.message.includes('not found')
                ? `Squad not found with invite code: "${cleanCode}". Please verify the code.`
                : joinError.message;
              return { success: false, error: friendlyMessage };
            }

            await loadRealSquad(user.id);
            return { success: true, squadId: targetSquadId };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to configure squad.';
          return { success: false, error: msg };
        }
      }

      // 2. Fallback local mock-state execution for unauthenticated / mock sessions
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
      setHasSquad(true);

      return { success: true };
    },
    [user, loadRealSquad]
  );

  return (
    <SquadContext.Provider
      value={{
        squad,
        missions,
        activity,
        lore,
        hasSquad,
        isLoadingSquad,
        getMissionById,
        submitMissionProof,
        createOrJoinSquad,
        petQuesty,
        refreshSquad,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
};

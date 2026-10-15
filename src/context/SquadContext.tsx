import React, { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Squad,
  SquadMember,
  Mission,
  ActivityEvent,
  LoreItem,
  SubmissionType,
  MascotEvolutionLevel,
  DailyMissionRow,
  MissionStatus,
  SquadMemberSubmission,
} from '../types';
import {
  INITIAL_SQUAD,
  INITIAL_MISSIONS,
  INITIAL_ACTIVITY,
  INITIAL_LORE,
} from '../lib/mockData';
import {
  SquadContext,
  type SubmitProofOptions,
  type SubmitProofResult,
  type ReviewSubmissionResult,
} from './squadContextDef';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EVOLUTION_STAGES } from '../components/mascot/mascotRegistry';

function mapDailyRowToMission(row: DailyMissionRow): Mission {
  return {
    id: row.assignment_id,
    assignmentId: row.assignment_id,
    missionId: row.mission_id,
    assignedDate: row.assigned_date,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    xpReward: row.xp_reward,
    durationHours: 24,
    deadlineText: 'Daily Challenge · 24h',
    rules: row.rules && row.rules.length > 0 ? row.rules : [
      'Must be completed in real life with your squad.',
      'Photo, video, voice, or text evidence required.',
      'Show the squad hand sign in visual submissions.',
    ],
    submissionRequirements: row.submission_requirements && row.submission_requirements.length > 0 ? row.submission_requirements : [
      '1 clear photo or video proof',
      'Short note or description',
    ],
    allowedTypes: (row.proof_type && row.proof_type.length > 0 ? row.proof_type : ['photo']) as SubmissionType[],
    status: (row.status as MissionStatus) || 'available',
    briefingExpression: 'mischievous',
    briefingSpeech: `HQ Directive: ${row.title}! Go out and make squad history.`,
    resultExpression: 'proud',
    resultReaction: `Objective locked! +${row.xp_reward} Squad XP verified.`,
    squadSubmissions: [],
  };
}

async function loadSubmissionsForSquad(
  squadId: string,
  profilesMap: Map<string, { id: string; display_name: string | null; aura: string | null }>,
  currentUserId?: string
): Promise<Map<string, SquadMemberSubmission[]>> {
  const result = new Map<string, SquadMemberSubmission[]>();
  try {
    const { data: subsData, error } = await supabase
      .from('mission_submissions')
      .select('*')
      .eq('squad_id', squadId)
      .order('submitted_at', { ascending: false });

    if (error || !subsData) {
      return result;
    }

    for (const sub of subsData) {
      let signedUrl: string | undefined = undefined;
      if (sub.proof_storage_path) {
        try {
          const { data: signed } = await supabase.storage
            .from('mission-proof')
            .createSignedUrl(sub.proof_storage_path, 3600);
          signedUrl = signed?.signedUrl;
        } catch {
          // Ignore individual sign error
        }
      }

      const p = profilesMap.get(sub.submitted_by);
      const isCurrent = currentUserId ? sub.submitted_by === currentUserId : false;
      const submissionItem: SquadMemberSubmission = {
        id: sub.id,
        memberId: sub.submitted_by,
        memberName: p?.display_name || (isCurrent ? 'You' : 'Teammate'),
        submittedAt: new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: sub.proof_type as SubmissionType,
        mediaUrl: signedUrl,
        caption: sub.text_content || 'Proof submitted',
        reactionsCount: 0,
        status: (sub.status as 'submitted' | 'approved' | 'rejected' | 'flagged') || 'submitted',
        reviewedBy: sub.reviewed_by,
        reviewedAt: sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        rejectionReason: sub.rejection_reason,
        isCurrentUser: isCurrent,
      };

      const existing = result.get(sub.assignment_id) || [];
      existing.push(submissionItem);
      result.set(sub.assignment_id, existing);
    }
  } catch (err) {
    console.warn('[SquadContext] Error loading submissions:', err);
  }
  return result;
}

export const SquadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [squad, setSquad] = useState<Squad>(INITIAL_SQUAD);
  const [hasSquad, setHasSquad] = useState<boolean>(false);
  const [isLoadingSquad, setIsLoadingSquad] = useState<boolean>(false);
  const [isLoadingMissions, setIsLoadingMissions] = useState<boolean>(false);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
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

      // 5. Fetch persistent submissions for this squad
      const submissionsMap = await loadSubmissionsForSquad(targetSquadId, profilesMap, userId);

      // 6. Fetch or generate Daily Mission Assignments for the squad
      setIsLoadingMissions(true);
      setMissionsError(null);
      const { data: dailyData, error: dailyError } = await supabase
        .rpc('get_or_create_daily_missions', {
          p_squad_id: targetSquadId,
          p_timezone: 'UTC',
        });

      if (dailyError) {
        console.warn('[SquadContext] Error loading daily missions:', dailyError.message);
        setMissionsError(dailyError.message);
        setMissions([]);
      } else if (dailyData) {
        const mapped = (dailyData as DailyMissionRow[]).map((row) => {
          const base = mapDailyRowToMission(row);
          const subs = submissionsMap.get(row.assignment_id) || [];
          const hasApproved = subs.some((s) => s.status === 'approved');
          const hasPending = subs.some((s) => s.status === 'submitted');
          let derivedStatus: MissionStatus = (row.status as MissionStatus) || 'available';
          if (row.status === 'completed' || hasApproved) {
            derivedStatus = 'completed';
          } else if (hasPending || row.status === 'in_progress') {
            derivedStatus = 'in_progress';
          }
          return {
            ...base,
            status: derivedStatus,
            squadSubmissions: subs,
          };
        });
        setMissions(mapped);
        setMissionsError(null);
      }

      // 7. Fetch authoritative squad lore vault entries
      try {
        const { data: loreData } = await supabase
          .from('squad_lore')
          .select('*')
          .eq('squad_id', targetSquadId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (loreData && loreData.length > 0) {
          const mappedRealLore: LoreItem[] = loreData.map((item) => {
            const author = profilesMap.get(item.created_by || '');
            const isMilestone = item.event_type === 'milestone_unlocked' || item.event_type === 'mascot_evolution';
            const icon = item.event_type === 'mascot_evolution' ? '✨' : item.event_type === 'milestone_unlocked' ? '🏆' : '🎯';
            const meta = (item.metadata || {}) as Record<string, any>;
            return {
              id: item.id,
              title: item.title,
              category: isMilestone ? 'milestones' : item.event_type === 'mission_completed' ? 'missions' : 'chaos',
              date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              submitterName: author?.display_name || 'Squad Teammate',
              caption: item.content || 'Archived in squad memory vault.',
              questyComment: item.event_type === 'mascot_evolution'
                ? `Questy evolved into ${meta.stage_name || 'a new form'}! 🌟`
                : item.event_type === 'milestone_unlocked'
                ? `Level ${meta.level || ''} unlocked! ⚡`
                : 'Another memory safely stored in the vault! 🔒',
              xpAwarded: Number(meta.xp_awarded || meta.total_xp || 0),
              fallbackIcon: icon,
              likesCount: 3,
              commentsCount: 1,
            };
          });
          setLore([...mappedRealLore, ...INITIAL_LORE]);
        } else {
          setLore(INITIAL_LORE);
        }
      } catch (loreErr) {
        console.warn('[SquadContext] Error loading squad lore:', loreErr);
      }
    } catch (err) {
      console.warn('[SquadContext] Unexpected error loading squad:', err);
    } finally {
      setIsLoadingSquad(false);
      setIsLoadingMissions(false);
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
          setMissions(INITIAL_MISSIONS);
          setIsLoadingMissions(false);
          setMissionsError(null);
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

  const refreshDailyMissions = useCallback(async () => {
    if (!hasSquad || !squad.id) return;
    setIsLoadingMissions(true);
    setMissionsError(null);
    try {
      const { data: allMemberships } = await supabase
        .from('squad_memberships')
        .select('user_id')
        .eq('squad_id', squad.id);
      const memberIds = allMemberships?.map((m) => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds);
      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));
      const submissionsMap = await loadSubmissionsForSquad(squad.id, profilesMap, user?.id);

      const { data: dailyData, error: dailyError } = await supabase
        .rpc('get_or_create_daily_missions', {
          p_squad_id: squad.id,
          p_timezone: 'UTC',
        });

      if (dailyError) {
        setMissionsError(dailyError.message);
      } else if (dailyData) {
        const mapped = (dailyData as DailyMissionRow[]).map((row) => {
          const base = mapDailyRowToMission(row);
          const subs = submissionsMap.get(row.assignment_id) || [];
          const hasApproved = subs.some((s) => s.status === 'approved');
          const hasPending = subs.some((s) => s.status === 'submitted');
          let derivedStatus: MissionStatus = (row.status as MissionStatus) || 'available';
          if (row.status === 'completed' || hasApproved) {
            derivedStatus = 'completed';
          } else if (hasPending || row.status === 'in_progress') {
            derivedStatus = 'in_progress';
          }
          return {
            ...base,
            status: derivedStatus,
            squadSubmissions: subs,
          };
        });
        setMissions(mapped);
        setMissionsError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh missions';
      setMissionsError(msg);
    } finally {
      setIsLoadingMissions(false);
    }
  }, [hasSquad, squad.id, user]);

  const getMissionById = useCallback(
    (id: string) => missions.find((m) => m.id === id || m.assignmentId === id || m.missionId === id),
    [missions]
  );

  const getSignedProofUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    if (!storagePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from('mission-proof')
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) {
        console.warn('[SquadContext] Failed to get signed proof URL:', error?.message);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.warn('[SquadContext] Unexpected error signing proof URL:', err);
      return null;
    }
  }, []);

  const reviewSubmission = useCallback(
    async (
      submissionId: string,
      decision: 'approved' | 'rejected',
      rejectionReason?: string
    ): Promise<ReviewSubmissionResult> => {
      // 1. Mock / Unauthenticated fallback
      if (!user || !isSupabaseConfigured || !squad.id) {
        let xpGained = 0;
        setMissions((prev) =>
          prev.map((m) => {
            const subIndex = m.squadSubmissions.findIndex((s) => s.id === submissionId);
            if (subIndex === -1) return m;

            xpGained = m.xpReward || 100;
            const updatedSubs = [...m.squadSubmissions];
            updatedSubs[subIndex] = {
              ...updatedSubs[subIndex],
              status: decision,
              rejectionReason: decision === 'rejected' ? rejectionReason : undefined,
              reviewedAt: 'Just now',
              reviewedBy: user?.id || 'mock-reviewer',
            };

            return {
              ...m,
              status: decision === 'approved' ? 'completed' : m.status,
              squadSubmissions: updatedSubs,
            };
          })
        );

        if (decision === 'approved') {
          const prevLevel = squad.level;
          const nextXp = squad.currentXp + xpGained;
          const nextLevel = Math.max(1, Math.floor(nextXp / 300) + 1);
          const prevStage = Math.min(5, Math.max(1, prevLevel)) as MascotEvolutionLevel;
          const nextStage = Math.min(5, Math.max(1, nextLevel)) as MascotEvolutionLevel;
          const leveledUp = nextLevel > prevLevel;
          const evolved = nextStage > prevStage;

          setSquad((prev) => ({
            ...prev,
            currentXp: nextXp,
            level: nextLevel,
            evolutionLevel: nextStage,
            targetXp: nextLevel * 300,
          }));

          return {
            success: true,
            decision,
            xpAwarded: xpGained,
            newTotalXp: nextXp,
            newLevel: nextLevel,
            newEvolutionStage: nextStage,
            leveledUp,
            evolved,
            stageName: EVOLUTION_STAGES[nextStage]?.name,
          };
        }

        return {
          success: true,
          decision,
          xpAwarded: 0,
        };
      }

      // 2. Real Authorized RPC Execution
      try {
        const { data, error } = await supabase.rpc('review_mission_submission', {
          p_submission_id: submissionId,
          p_decision: decision,
          p_rejection_reason: decision === 'rejected' ? (rejectionReason?.trim() || null) : null,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const res = data as {
          success: boolean;
          decision: 'approved' | 'rejected';
          xp_awarded: number;
          new_total_xp?: number;
          new_level?: number;
          new_evolution_stage?: number;
          leveled_up?: boolean;
          evolved?: boolean;
          stage_name?: string;
          assignment_id?: string;
        };

        // Reload squad progression and missions state authoritatively
        await loadRealSquad(user.id);

        return {
          success: true,
          decision: res.decision,
          xpAwarded: res.xp_awarded,
          newTotalXp: res.new_total_xp,
          newLevel: res.new_level,
          newEvolutionStage: res.new_evolution_stage,
          leveledUp: res.leveled_up,
          evolved: res.evolved,
          stageName: res.stage_name,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Review operation failed';
        return { success: false, error: msg };
      }
    },
    [user, squad.id, squad.level, squad.currentXp, loadRealSquad]
  );

  const petQuesty = useCallback(() => {
    setSquad((prev) => ({
      ...prev,
      currentXp: Math.min(prev.currentXp + 5, prev.targetXp + 100),
    }));
    return 5;
  }, []);

  const submitMissionProof = useCallback(
    async (
      missionId: string,
      proof: SubmitProofOptions
    ): Promise<SubmitProofResult> => {
      const targetMission = missions.find(
        (m) => m.id === missionId || m.assignmentId === missionId || m.missionId === missionId
      );
      const assignmentId = targetMission?.assignmentId || missionId;
      const currentUserName = profile?.display_name || squad.members.find((m) => m.isCurrentUser)?.name || 'Adventurer';

      // 1. Real persistence when user is authenticated & Supabase configured
      if (user && isSupabaseConfigured && squad.id) {
        let uploadedStoragePath: string | null = null;
        let signedUrl: string | undefined = undefined;

        try {
          // A. If a file is provided, validate & upload to private 'mission-proof' bucket
          if (proof.file) {
            // File size validation (50MB limit)
            const MAX_SIZE = 50 * 1024 * 1024;
            if (proof.file.size > MAX_SIZE) {
              return { success: false, error: 'File size exceeds 50MB maximum limit.' };
            }

            // MIME type validation
            const ALLOWED_MIME_TYPES = [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
              'video/mp4',
              'video/webm',
              'audio/mpeg',
              'audio/webm',
              'audio/wav',
              'audio/mp4',
            ];
            if (!ALLOWED_MIME_TYPES.includes(proof.file.type)) {
              return {
                success: false,
                error: `File type "${proof.file.type}" is not supported. Please upload JPG, PNG, WebP, GIF, MP4, or WebM.`,
              };
            }

            // Safe filename generation: <squad_id>/<user_id>/<timestamp>_<uuid>.<ext>
            const rawExt = proof.file.name.split('.').pop()?.toLowerCase() || '';
            const safeExt = rawExt.replace(/[^a-z0-9]/g, '') || (proof.type === 'video' ? 'mp4' : 'jpg');
            const uniqueFileName = `${Date.now()}_${crypto.randomUUID()}.${safeExt}`;
            const storagePath = `${squad.id}/${user.id}/${uniqueFileName}`;

            const { error: uploadError } = await supabase.storage
              .from('mission-proof')
              .upload(storagePath, proof.file, {
                contentType: proof.file.type,
                upsert: false,
              });

            if (uploadError) {
              return { success: false, error: `Upload failed: ${uploadError.message}` };
            }

            uploadedStoragePath = storagePath;
          }

          // B. Database insert into public.mission_submissions
          const { data: subRecord, error: insertError } = await supabase
            .from('mission_submissions')
            .insert({
              assignment_id: assignmentId,
              squad_id: squad.id,
              submitted_by: user.id,
              proof_type: proof.type,
              proof_storage_path: uploadedStoragePath,
              text_content: proof.caption?.trim() || null,
              status: 'submitted',
            })
            .select()
            .single();

          // C. If database insert fails, clean up the orphaned uploaded file
          if (insertError) {
            if (uploadedStoragePath) {
              try {
                await supabase.storage.from('mission-proof').remove([uploadedStoragePath]);
                console.info('[SquadContext] Cleaned up orphaned proof file:', uploadedStoragePath);
              } catch (cleanupErr) {
                console.error('[SquadContext] Failed to cleanup orphaned file:', uploadedStoragePath, cleanupErr);
              }
            }
            return { success: false, error: `Database submission failed: ${insertError.message}` };
          }

          // D. Transition assignment status from 'available' to 'in_progress'
          if (targetMission?.status === 'available') {
            await supabase
              .from('mission_assignments')
              .update({ status: 'in_progress' })
              .eq('id', assignmentId)
              .eq('status', 'available');
          }

          // E. Generate signed URL for immediate display
          if (uploadedStoragePath) {
            const { data: signedData } = await supabase.storage
              .from('mission-proof')
              .createSignedUrl(uploadedStoragePath, 3600);
            signedUrl = signedData?.signedUrl;
          }

          // F. Update local React state with persistent record (No XP awarded in Phase 4B!)
          const newSub: SquadMemberSubmission = {
            id: subRecord.id,
            memberId: user.id,
            memberName: currentUserName,
            submittedAt: 'Just now',
            type: proof.type,
            caption: proof.caption?.trim() || 'Submitted mission proof with squad hand sign!',
            mediaUrl: signedUrl || proof.mediaUrl,
            reactionsCount: 0,
            status: 'submitted',
            isCurrentUser: true,
          };

          setMissions((prev) =>
            prev.map((m) =>
              m.id === missionId || m.assignmentId === assignmentId
                ? {
                    ...m,
                    status: m.status === 'completed' ? 'completed' : 'in_progress',
                    squadSubmissions: [newSub, ...m.squadSubmissions],
                  }
                : m
            )
          );

          // Activity event (no XP awarded in Phase 4B)
          const newActivity: ActivityEvent = {
            id: `act-${Date.now()}`,
            memberId: user.id,
            memberName: currentUserName,
            type: 'proof_submitted',
            content: `submitted proof for "${targetMission ? targetMission.title : 'Mission'}"`,
            timeAgo: 'Just now',
            xpEarned: 0,
          };
          setActivity((prev) => [newActivity, ...prev]);

          return {
            success: true,
            submissionId: subRecord.id,
            signedUrl,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown submission error';
          // Cleanup orphan if error occurred after upload
          if (uploadedStoragePath) {
            try {
              await supabase.storage.from('mission-proof').remove([uploadedStoragePath]);
            } catch (cleanErr) {
              console.error('[SquadContext] Orphan cleanup error:', cleanErr);
            }
          }
          return { success: false, error: msg };
        }
      }

      // 2. Fallback for unauthenticated / mock sessions
      const fallbackSubId = `sub-${Date.now()}`;
      const newSubmission: SquadMemberSubmission = {
        id: fallbackSubId,
        memberId: user?.id || 'mem-1',
        memberName: currentUserName,
        submittedAt: 'Just now',
        type: proof.type,
        caption: proof.caption || 'Submitted mission proof with squad hand sign!',
        mediaUrl: proof.mediaUrl,
        reactionsCount: 0,
        status: 'submitted',
        isCurrentUser: true,
      };

      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId || m.assignmentId === assignmentId
            ? {
                ...m,
                status: 'in_progress',
                squadSubmissions: [newSubmission, ...m.squadSubmissions],
              }
            : m
        )
      );

      return {
        success: true,
        submissionId: fallbackSubId,
        signedUrl: proof.mediaUrl,
      };
    },
    [missions, user, profile, squad.id, squad.members]
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
        isLoadingMissions,
        missionsError,
        getMissionById,
        submitMissionProof,
        reviewSubmission,
        getSignedProofUrl,
        createOrJoinSquad,
        petQuesty,
        refreshSquad,
        refreshDailyMissions,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
};

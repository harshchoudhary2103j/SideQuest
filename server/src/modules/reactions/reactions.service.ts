import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/env.js';
import type {
  AuthoritativeEventContext,
  QuestyEventType,
  QuestyReactionResponse,
} from './reactions.types.js';
import {
  QUESTY_SYSTEM_PROMPT,
  buildQuestyUserPrompt,
  getCuratedFallback,
  validateAndCleanAiReaction,
} from './questyPrompt.js';

// Canonical stage names
const STAGE_NAMES: Record<number, string> = {
  1: 'Star Pup',
  2: 'Glow Buddy',
  3: 'Quest Pal',
  4: 'Star Guardian',
  5: 'Legendary Questy',
};

// In-Memory Idempotency Cache: key -> CachedReaction
interface CachedReaction {
  reaction: string;
  expression: any;
  source: 'ai' | 'fallback';
  eventType: QuestyEventType;
  createdAt: number;
}
const reactionCache = new Map<string, CachedReaction>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-Memory Rate Limiting: squadId -> timestamp[]
const squadRateLimits = new Map<string, number[]>();
const RATE_LIMIT_MAX_PER_MINUTE = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Configurable / Mockable OpenAI Client
let openAiClientInstance: OpenAI | null = null;

export function getOpenAiClient(): OpenAI | null {
  if (openAiClientInstance) return openAiClientInstance;
  if (!config.openai.isConfigured || !config.openai.apiKey) {
    return null;
  }
  openAiClientInstance = new OpenAI({
    apiKey: config.openai.apiKey,
    timeout: config.openai.timeoutMs,
  });
  return openAiClientInstance;
}

export function setMockOpenAiClient(mockClient: OpenAI | null): void {
  openAiClientInstance = mockClient;
}

export function clearReactionCache(): void {
  reactionCache.clear();
  squadRateLimits.clear();
}

/**
 * Checks squad rate limit.
 * Returns true if allowed, false if rate limited.
 */
function checkSquadRateLimit(squadId: string): boolean {
  const now = Date.now();
  const timestamps = (squadRateLimits.get(squadId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
    return false;
  }

  timestamps.push(now);
  squadRateLimits.set(squadId, timestamps);
  return true;
}

import { getAdminSupabaseClient } from '../../lib/supabase.js';

/**
 * Fetches authoritative event context from database, verifying caller's squad membership.
 */
export async function getAuthoritativeEventContext(
  scopedSupabase: SupabaseClient,
  submissionId: string,
  callerUserId: string,
  preferredEventType?: QuestyEventType
): Promise<{ context: AuthoritativeEventContext; squadId: string }> {
  // 1. Determine authoritative squadId for submission
  let squadId: string | null = null;

  // Try security-definer helper RPC first to reliably distinguish 404 from 403 under RLS
  const { data: rpcSquadId, error: rpcErr } = await scopedSupabase
    .rpc('get_submission_squad_id', { p_submission_id: submissionId });

  if (!rpcErr && rpcSquadId) {
    squadId = rpcSquadId;
  } else if (config.supabase.serviceRoleKey) {
    try {
      const admin = getAdminSupabaseClient();
      const { data } = await admin
        .from('mission_submissions')
        .select('squad_id')
        .eq('id', submissionId)
        .maybeSingle();
      squadId = data?.squad_id || null;
    } catch {
      squadId = null;
    }
  }

  // If squadId is still null, submission truly does not exist
  if (!squadId) {
    const notFoundErr = new Error('Submission not found');
    (notFoundErr as any).statusCode = 404;
    throw notFoundErr;
  }

  // 2. Verify caller is an active member of this squad (403 Forbidden if not)
  const { data: membership, error: memErr } = await scopedSupabase
    .from('squad_memberships')
    .select('id, role')
    .eq('squad_id', squadId)
    .eq('user_id', callerUserId)
    .maybeSingle();

  if (memErr || !membership) {
    const authErr = new Error('Access denied: Caller is not an active member of this squad');
    (authErr as any).statusCode = 403;
    throw authErr;
  }

  // 3. Now fetch the full submission record (as authorized squad member)
  const { data: submission, error: subErr } = await scopedSupabase
    .from('mission_submissions')
    .select('id, squad_id, assignment_id, submitted_by, reviewed_by, status')
    .eq('id', submissionId)
    .maybeSingle();

  if (subErr || !submission) {
    const notFoundErr = new Error('Submission not found');
    (notFoundErr as any).statusCode = 404;
    throw notFoundErr;
  }

  if (submission.status !== 'approved') {
    const unapprovedErr = new Error('Reactions can only be generated for approved submissions');
    (unapprovedErr as any).statusCode = 400;
    throw unapprovedErr;
  }

  // 3. Fetch mission assignment & definition details
  const { data: assignment, error: assignErr } = await scopedSupabase
    .from('mission_assignments')
    .select('id, mission_id')
    .eq('id', submission.assignment_id)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error('Assignment associated with submission not found');
  }

  const { data: missionDef, error: defErr } = await scopedSupabase
    .from('mission_definitions')
    .select('title, category, difficulty, xp_reward')
    .eq('id', assignment.mission_id)
    .maybeSingle();

  if (defErr || !missionDef) {
    throw new Error('Mission definition associated with assignment not found');
  }

  // 4. Fetch squad progression details
  const { data: progression, error: progErr } = await scopedSupabase
    .from('squad_progression')
    .select('xp, level, current_evolution_stage')
    .eq('squad_id', squadId)
    .maybeSingle();

  if (progErr || !progression) {
    throw new Error('Squad progression record not found');
  }

  // 5. Fetch submitter and reviewer display names
  const { data: profiles } = await scopedSupabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [submission.submitted_by, submission.reviewed_by || '']);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));
  const submitterName = profileMap.get(submission.submitted_by) || 'Squad Mate';
  const reviewerName = profileMap.get(submission.reviewed_by || '') || 'Teammate';

  const stage = Math.min(5, Math.max(1, progression.current_evolution_stage || 1));
  const stageName = STAGE_NAMES[stage] || 'Star Pup';

  // Determine authoritative event type
  let eventType: QuestyEventType = preferredEventType || 'mission_approved';
  if (preferredEventType === 'mascot_evolved' && stage <= 1) {
    // Cannot claim evolution at stage 1
    eventType = 'mission_approved';
  }

  return {
    squadId,
    context: {
      submissionId,
      assignmentId: submission.assignment_id,
      squadId,
      submitterName,
      reviewerName,
      missionTitle: missionDef.title,
      missionCategory: missionDef.category,
      missionDifficulty: missionDef.difficulty,
      xpAwarded: Number(missionDef.xp_reward) || 0,
      newLevel: progression.level || 1,
      newEvolutionStage: stage,
      stageName,
      eventType,
    },
  };
}

/**
 * Generates or retrieves an authoritative Questy reaction for an approved submission event.
 * Fully isolated from the mission review transaction.
 */
export async function generateQuestyReaction(
  scopedSupabase: SupabaseClient,
  submissionId: string,
  callerUserId: string,
  requestedEventType?: QuestyEventType
): Promise<QuestyReactionResponse> {
  // 1. Authoritative event verification
  const { context, squadId } = await getAuthoritativeEventContext(
    scopedSupabase,
    submissionId,
    callerUserId,
    requestedEventType
  );

  const eventType = context.eventType;
  const cacheKey = `${submissionId}:${eventType}`;

  // 2. Check Deduplication Cache
  const cached = reactionCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return {
      success: true,
      reaction: cached.reaction,
      expression: cached.expression,
      source: cached.source,
      eventType: cached.eventType,
      cached: true,
    };
  }

  // 3. Check Rate Limit (fall back smoothly without failing request)
  if (!checkSquadRateLimit(squadId)) {
    const fallback = getCuratedFallback(eventType, context.stageName);
    return {
      success: true,
      reaction: fallback.reaction,
      expression: fallback.expression,
      source: 'fallback',
      eventType,
    };
  }

  // 4. Check Provider Configuration
  const client = getOpenAiClient();
  if (!client) {
    const fallback = getCuratedFallback(eventType, context.stageName);
    const result: QuestyReactionResponse = {
      success: true,
      reaction: fallback.reaction,
      expression: fallback.expression,
      source: 'fallback',
      eventType,
    };
    reactionCache.set(cacheKey, { ...fallback, source: 'fallback', eventType, createdAt: Date.now() });
    return result;
  }

  // 5. Call OpenAI with Prompt Isolation & Strict Timeout
  try {
    const userPrompt = buildQuestyUserPrompt(context);

    const completion = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: QUESTY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 60,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const rawChoice = completion.choices?.[0]?.message?.content || '';
    const validated = validateAndCleanAiReaction(rawChoice);

    if (validated) {
      const response: QuestyReactionResponse = {
        success: true,
        reaction: validated.reaction,
        expression: validated.expression,
        source: 'ai',
        eventType,
      };
      reactionCache.set(cacheKey, {
        reaction: validated.reaction,
        expression: validated.expression,
        source: 'ai',
        eventType,
        createdAt: Date.now(),
      });
      return response;
    }

    // Malformed AI output -> Curated Fallback
    const fallback = getCuratedFallback(eventType, context.stageName);
    return {
      success: true,
      reaction: fallback.reaction,
      expression: fallback.expression,
      source: 'fallback',
      eventType,
    };
  } catch {
    // Provider timeout, rate limit, or network error -> Graceful Fallback
    const fallback = getCuratedFallback(eventType, context.stageName);
    return {
      success: true,
      reaction: fallback.reaction,
      expression: fallback.expression,
      source: 'fallback',
      eventType,
    };
  }
}

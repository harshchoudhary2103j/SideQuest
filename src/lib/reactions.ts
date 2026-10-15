import { supabase, isSupabaseConfigured } from './supabase';

export type QuestyEventType = 'mission_approved' | 'level_up' | 'mascot_evolved';

export interface QuestyReaction {
  reaction: string;
  expression: 'happy' | 'excited' | 'proud' | 'mischievous';
  source: 'ai' | 'fallback';
  eventType: QuestyEventType;
}

const LOCAL_FALLBACKS: Record<QuestyEventType, string[]> = {
  mission_approved: [
    "Boom! Proof verified and XP added to the vault. That's how we roll! ⚡",
    "Mission cleared! The squad streak stays alive and kicking! 🐾",
    "Locked in! Another iconic sidequest in the books. Who's next? 🔥",
  ],
  level_up: [
    "SQUAD LEVEL UP! We're ascending! The grind never stops! 🚀",
    "Level up unlocked! Look at us climbing the ranks together! ⚡",
  ],
  mascot_evolved: [
    "WOAH, check out my new form! We are evolving into absolute legends! ✨",
    "Questy evolution achieved! I can feel the stardust surging through us! 🌟",
  ],
};

function getLocalFallback(eventType: QuestyEventType, stageName?: string): QuestyReaction {
  const options = LOCAL_FALLBACKS[eventType] || LOCAL_FALLBACKS.mission_approved;
  let text = options[Math.floor(Math.random() * options.length)] || options[0];

  if (eventType === 'mascot_evolved' && stageName) {
    text = `WOAH! Questy evolved into ${stageName}! We are evolving into absolute legends together! ✨`;
  }

  return {
    reaction: text,
    expression: eventType === 'mascot_evolved' ? 'excited' : 'happy',
    source: 'fallback',
    eventType,
  };
}

// In-flight tracking to prevent duplicate reaction requests
const inFlightRequests = new Set<string>();

/**
 * Requests an authoritative Questy reaction for an approved submission.
 * Completely non-blocking and safe: If the server or OpenAI times out or fails,
 * a polished local fallback reaction is returned gracefully.
 */
export async function fetchQuestyReaction(
  submissionId: string,
  eventType: QuestyEventType = 'mission_approved',
  stageName?: string
): Promise<QuestyReaction> {
  const key = `${submissionId}:${eventType}`;
  if (inFlightRequests.has(key)) {
    return getLocalFallback(eventType, stageName);
  }

  inFlightRequests.add(key);

  try {
    if (!isSupabaseConfigured) {
      return getLocalFallback(eventType, stageName);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return getLocalFallback(eventType, stageName);
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${baseUrl}/api/v1/reactions/submission/${submissionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return getLocalFallback(eventType, stageName);
    }

    const json = await res.json();
    if (json && json.reaction) {
      return {
        reaction: String(json.reaction).trim(),
        expression: json.expression || 'excited',
        source: json.source || 'ai',
        eventType,
      };
    }

    return getLocalFallback(eventType, stageName);
  } catch {
    // Network failure, timeout, or abort
    return getLocalFallback(eventType, stageName);
  } finally {
    inFlightRequests.delete(key);
  }
}

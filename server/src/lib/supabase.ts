/**
 * SideQuest — Server Supabase Client Strategy
 *
 * Provides two distinct client models:
 * 1. Scoped Client: Enforces Row Level Security (RLS) under the user's verified JWT.
 * 2. Admin Client: Privileged service_role client strictly for trusted background tasks.
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from './logger.js';

let publicSupabaseClient: SupabaseClient | null = null;
let adminSupabaseClient: SupabaseClient | null = null;

/**
 * Returns a server client initialized with public/anon credentials.
 * Used for token verification and public directory operations.
 */
export function getPublicSupabaseClient(): SupabaseClient {
  if (!config.supabase.isConfigured || !config.supabase.url || !config.supabase.anonKey) {
    throw new Error(
      '[Supabase Server] Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.'
    );
  }

  if (!publicSupabaseClient) {
    publicSupabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return publicSupabaseClient;
}

/**
 * Creates a scoped Supabase client authenticated as the calling user.
 * ALL operations through this client execute with the caller's JWT,
 * strictly subject to PostgreSQL Row Level Security (RLS) policies.
 */
export function createScopedSupabaseClient(accessToken: string): SupabaseClient {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error(
      '[Supabase Server] Cannot create scoped client: SUPABASE_URL or SUPABASE_ANON_KEY missing.'
    );
  }

  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Returns the privileged admin client using SUPABASE_SERVICE_ROLE_KEY.
 * WARNING: Bypasses Row Level Security.
 * Use ONLY for server-authoritative logic (e.g. XP allocation, AI evaluation triggers, cron cleanup).
 * NEVER use for handling arbitrary user requests directly without explicit authorization checks.
 */
export function getAdminSupabaseClient(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      '[Supabase Server] Privileged operation requested but SUPABASE_SERVICE_ROLE_KEY is not configured.'
    );
  }

  if (!adminSupabaseClient) {
    adminSupabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('[Supabase Server] Initialized privileged service-role client.');
  }

  return adminSupabaseClient;
}

/**
 * Verifies an incoming access token with Supabase Auth.
 * Returns the authenticated User or null if invalid/expired.
 */
export async function verifyAccessToken(token: string): Promise<User | null> {
  try {
    const client = getPublicSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (err) {
    logger.error('[Supabase Server] Error verifying access token', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

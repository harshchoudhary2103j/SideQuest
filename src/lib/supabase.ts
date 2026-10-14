/**
 * SideQuest — Frontend Supabase Client
 *
 * Configured using public project credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Supabase handles client-side authentication and Row Level Security enforcement.
 *
 * SECURITY NOTICE:
 * - NEVER put the Supabase service_role key or any secrets in this file or any VITE_ variable.
 * - All mutations from this client are evaluated by PostgreSQL Row Level Security (RLS).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-public-anon-key')
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // Helpful development notice without spamming error overlays
  console.info(
    '[SideQuest Supabase] Public Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. The application is running in Phase 2 mock mode. Refer to docs/architecture-phase-3a.md for configuration instructions.'
  );
}

// Fallback dummy credentials to allow bundle creation and mock-mode execution without throwing at startup
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Returns whether live backend connectivity is configured in the current session.
 */
export function checkBackendStatus(): { isConfigured: boolean; url?: string } {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : undefined,
  };
}

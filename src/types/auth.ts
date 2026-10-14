import type { User, Session } from '@supabase/supabase-js';
import type { Database } from './database';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    aura?: string
  ) => Promise<{
    user: User | null;
    session: Session | null;
    needsEmailConfirmation: boolean;
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    display_name?: string;
    avatar_path?: string | null;
    aura?: string | null;
  }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

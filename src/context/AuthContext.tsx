import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/auth';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);

  // Guard against concurrent profile fetches
  const fetchingProfileFor = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured) return null;
    if (fetchingProfileFor.current === userId) return null;

    fetchingProfileFor.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AuthContext] Failed to load profile:', error.message);
        return null;
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // If profile is temporarily missing right after signup trigger, retry once after a short delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      const retry = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (retry.data) {
        setProfile(retry.data);
        return retry.data;
      }

      return null;
    } catch (err) {
      console.warn('[AuthContext] Unexpected error fetching profile:', err);
      return null;
    } finally {
      fetchingProfileFor.current = null;
    }
  }, []);

  // 1. Initial Session Restoration & Single Auth State Listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    // Restore existing session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;

        if (error) {
          console.warn('[AuthContext] Error retrieving session:', error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          fetchProfile(initialSession.user.id).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] Unexpected error during session restoration:', err);
        if (isMounted) setIsLoading(false);
      });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with email and password
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured) {
        return {
          error: new Error('Supabase credentials are not configured. Check .env.local.'),
        };
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error };
        }

        return { error: null };
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err : new Error('An unexpected login error occurred.'),
        };
      }
    },
    []
  );

  // Sign Up with email, password, and metadata
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      aura?: string
    ): Promise<{
      user: User | null;
      session: Session | null;
      needsEmailConfirmation: boolean;
      error: Error | null;
    }> => {
      if (!isSupabaseConfigured) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: new Error('Supabase credentials are not configured. Check .env.local.'),
        };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName?.trim() || splitEmailPrefix(email),
              aura: aura || 'midnight_rebel',
            },
          },
        });

        if (error) {
          return {
            user: null,
            session: null,
            needsEmailConfirmation: false,
            error,
          };
        }

        const needsEmailConfirmation = Boolean(data.user && !data.session);

        return {
          user: data.user,
          session: data.session,
          needsEmailConfirmation,
          error: null,
        };
      } catch (err: unknown) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: err instanceof Error ? err : new Error('An unexpected signup error occurred.'),
        };
      }
    },
    []
  );

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Error during signOut:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  // Update Profile
  const updateProfile = useCallback(
    async (updates: {
      display_name?: string;
      avatar_path?: string | null;
      aura?: string | null;
    }): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Authentication required to update profile.') };
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          return { error };
        }

        if (data) {
          setProfile(data);
        }

        return { error: null };
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err : new Error('Failed to update profile.'),
        };
      }
    },
    [user]
  );

  // Refresh Profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function splitEmailPrefix(email: string): string {
  const prefix = email.split('@')[0];
  if (!prefix) return 'Adventurer';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

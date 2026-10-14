import ws from 'ws';
(globalThis as any).WebSocket = ws;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const testEmail = `sidequest.alex.thorne.${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';

  console.log('[Auth Test] Testing signUp with:', testEmail);
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        display_name: 'Test Adventurer',
        aura: 'neon_goblin',
      },
    },
  });

  if (error) {
    console.error('[Sign Up Error]', error.message);
    return;
  }

  console.log('[Sign Up Result]');
  console.log('User ID:', data.user?.id);
  console.log('Session present?:', Boolean(data.session));
  console.log('Email confirmed at:', data.user?.email_confirmed_at);
  console.log('Identities count:', data.user?.identities?.length);

  // If session is present, try reading profile
  if (data.session) {
    console.log('[Auto-login enabled] Reading profile as authenticated user...');
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single();
    console.log('Profile result:', profile, pError ? pError.message : 'OK');
  } else {
    console.log('[Email confirmation required] Supabase is configured with email confirmation.');
  }

  // Clean up test user in PostgreSQL
  if (data.user?.id) {
    console.log('[Cleanup] Removing test user from database...');
    const pg = await import('pg');
    const client = new pg.default.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    await client.query('DELETE FROM auth.users WHERE id = $1', [data.user.id]);
    await client.end();
    console.log('[Cleanup Complete]');
  }
}

main();

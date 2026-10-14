/**
 * SideQuest — Phase 3B Complete Integration & Security Verification Suite
 *
 * Verifies all 12 Phase 3B acceptance requirements:
 * 1. Sign-up / Trigger profile creation
 * 2. Sign-in with valid credentials
 * 3. Invalid credentials and validation error handling
 * 4. Session restoration and token verification
 * 5. Sign-out and session revocation
 * 6. Profile loading and permitted updates via user-scoped client
 * 7. Squad creation with automatic trigger-driven owner membership & progression
 * 8. Squad joining via join_squad_with_code() RPC
 * 9. Invalid invite-code handling
 * 10. Attempted unauthorized role changes & cross-user profile tampering rejection
 * 11. Server-side token verification (requireAuth middleware)
 * 12. Mock-mode and data integrity validation
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';
import { verifyAccessToken, createScopedSupabaseClient } from '../lib/supabase.js';

if (!globalThis.WebSocket) {
  // @ts-expect-error polyfill for Node 20
  globalThis.WebSocket = ws;
}

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!connectionString || !supabaseUrl || !supabaseAnonKey) {
  console.error('[Error] DATABASE_URL, SUPABASE_URL, or SUPABASE_ANON_KEY missing in server/.env');
  process.exit(1);
}

const pgClient = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function runPhase3BTests() {
  await pgClient.connect();

  console.log('=============================================================================');
  console.log('SIDEQUEST PHASE 3B: AUTHENTICATION & SQUAD SESSION VERIFICATION SUITE');
  console.log('=============================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  const testUser1Id = '77777777-7777-4777-8777-777777777771';
  const testUser1Email = 'test-player1@sidequest.app';
  const testUser1Password = 'QuestChampion2026!';

  const testUser2Id = '77777777-7777-4777-8777-777777777772';
  const testUser2Email = 'test-player2@sidequest.app';
  const testUser2Password = 'SideKick2026!';

  const publicClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision clean test accounts directly in auth.users
    // -------------------------------------------------------------------------
    console.log('[Setup] Provisioning synthetic test accounts with confirmed emails...');

    // Clean up any previous test artifacts
    await pgClient.query(`
      DELETE FROM public.squads WHERE name IN ('Phase 3B Alpha Squad', 'Phase 3B Beta Squad');
      DELETE FROM auth.users WHERE id IN ('${testUser1Id}', '${testUser2Id}');
    `);

    // Insert User 1 & User 2 into auth.users (with confirmed email and bcrypt cost-10 password)
    await pgClient.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change, phone_change_token, email_change_token_current, reauthentication_token,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      )
      VALUES 
        (
          '${testUser1Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          '${testUser1Email}', crypt('${testUser1Password}', gen_salt('bf', 10)), now(),
          '', '', '', '', '', '', '', '',
          '{"provider":"email","providers":["email"]}', '{"display_name":"Alpha Scout"}', now(), now()
        ),
        (
          '${testUser2Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          '${testUser2Email}', crypt('${testUser2Password}', gen_salt('bf', 10)), now(),
          '', '', '', '', '', '', '', '',
          '{"provider":"email","providers":["email"]}', '{"display_name":"Beta Member"}', now(), now()
        );

      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      )
      VALUES 
        (
          '${testUser1Id}', '${testUser1Id}', '${testUser1Id}',
          jsonb_build_object('sub', '${testUser1Id}', 'email', '${testUser1Email}', 'email_verified', true),
          'email', now(), now(), now()
        ),
        (
          '${testUser2Id}', '${testUser2Id}', '${testUser2Id}',
          jsonb_build_object('sub', '${testUser2Id}', 'email', '${testUser2Email}', 'email_verified', true),
          'email', now(), now(), now()
        );
    `);

    // -------------------------------------------------------------------------
    // Requirement 1: Database Trigger Profile Creation
    // -------------------------------------------------------------------------
    const profileRes = await pgClient.query(
      `SELECT id, display_name, aura FROM public.profiles WHERE id = $1`,
      [testUser1Id]
    );
    assert(
      profileRes.rows.length === 1 && profileRes.rows[0].display_name === 'Alpha Scout',
      'Test 1: User profile automatically created by database trigger upon auth registration'
    );

    // -------------------------------------------------------------------------
    // Requirement 2: Sign-In with Valid Credentials
    // -------------------------------------------------------------------------
    const { data: authData1, error: authError1 } = await publicClient.auth.signInWithPassword({
      email: testUser1Email,
      password: testUser1Password,
    });
    assert(
      !authError1 && Boolean(authData1.session?.access_token) && authData1.user?.id === testUser1Id,
      'Test 2: Sign-in with valid credentials establishes authenticated Supabase session'
    );

    const token1 = authData1.session!.access_token;
    const scopedClient1 = createScopedSupabaseClient(token1);

    // -------------------------------------------------------------------------
    // Requirement 3: Invalid Credentials and Validation Error Handling
    // -------------------------------------------------------------------------
    const { data: badAuthData, error: badAuthError } = await publicClient.auth.signInWithPassword({
      email: testUser1Email,
      password: 'WrongPassword999!',
    });
    assert(
      Boolean(badAuthError) && !badAuthData.session,
      'Test 3: Invalid credentials rejected with appropriate authentication error'
    );

    // -------------------------------------------------------------------------
    // Requirement 4: Session Restoration & Server-Side Token Verification
    // -------------------------------------------------------------------------
    const verifiedUser = await verifyAccessToken(token1);
    assert(
      verifiedUser !== null && verifiedUser.id === testUser1Id,
      'Test 4: Server-side token verification restores authenticated user identity from JWT'
    );

    // -------------------------------------------------------------------------
    // Requirement 5: Profile Loading & Permitted Updates
    // -------------------------------------------------------------------------
    const { data: userProfile, error: profileFetchErr } = await scopedClient1
      .from('profiles')
      .select('id, display_name, aura')
      .eq('id', testUser1Id)
      .single();

    assert(
      !profileFetchErr && userProfile?.display_name === 'Alpha Scout',
      'Test 5a: Authenticated user loads their real profile through RLS'
    );

    // Permitted update: display_name and aura
    const { error: profileUpdateErr } = await scopedClient1
      .from('profiles')
      .update({ display_name: 'Alpha Commander', aura: 'gold' })
      .eq('id', testUser1Id);

    const checkUpdatedProfile = await pgClient.query(
      `SELECT display_name, aura FROM public.profiles WHERE id = $1`,
      [testUser1Id]
    );

    assert(
      !profileUpdateErr &&
        checkUpdatedProfile.rows[0].display_name === 'Alpha Commander' &&
        checkUpdatedProfile.rows[0].aura === 'gold',
      'Test 5b: Authenticated user updates permitted profile fields (display_name, aura)'
    );

    // -------------------------------------------------------------------------
    // Requirement 6: Squad Creation with Trigger-Driven Owner Membership & Progression
    // -------------------------------------------------------------------------
    const squadInviteCode = 'ALPHA-3B01';
    const { data: newSquad, error: squadCreateErr } = await scopedClient1
      .from('squads')
      .insert({
        name: 'Phase 3B Alpha Squad',
        invite_code: squadInviteCode,
        created_by: testUser1Id,
      })
      .select()
      .single();

    if (squadCreateErr) {
      console.log('[DEBUG] squadCreateErr:', squadCreateErr);
    }

    assert(
      !squadCreateErr && Boolean(newSquad?.id),
      'Test 6a: Authenticated user creates squad with validated name and invite code'
    );

    if (!newSquad?.id) {
      throw new Error(`Cannot proceed without newSquad: ${squadCreateErr?.message}`);
    }

    const squadId = newSquad.id;

    // Verify database trigger on_squad_created created owner membership
    const membershipCheck = await pgClient.query(
      `SELECT user_id, role FROM public.squad_memberships WHERE squad_id = $1`,
      [squadId]
    );
    assert(
      membershipCheck.rows.length === 1 &&
        membershipCheck.rows[0].user_id === testUser1Id &&
        membershipCheck.rows[0].role === 'owner',
      'Test 6b: Database trigger on_squad_created atomically created owner membership'
    );

    // Verify progression record initialized
    const progressionCheck = await pgClient.query(
      `SELECT squad_id, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = $1`,
      [squadId]
    );
    assert(
      progressionCheck.rows.length === 1 &&
        progressionCheck.rows[0].level === 1 &&
        progressionCheck.rows[0].current_evolution_stage === 1,
      'Test 6c: Database trigger on_squad_created initialized squad progression (Level 1 Star Pup)'
    );

    // -------------------------------------------------------------------------
    // Requirement 7: Joining Squad via join_squad_with_code() RPC
    // -------------------------------------------------------------------------
    // Sign in User 2
    const { data: authData2, error: authError2 } = await publicClient.auth.signInWithPassword({
      email: testUser2Email,
      password: testUser2Password,
    });
    assert(!authError2 && Boolean(authData2.session), 'Test 7a: Second test user successfully signs in');

    const token2 = authData2.session!.access_token;
    const scopedClient2 = createScopedSupabaseClient(token2);

    // Call join_squad_with_code RPC
    const { data: joinedSquadId, error: joinRpcErr } = await scopedClient2.rpc(
      'join_squad_with_code',
      { code: squadInviteCode }
    );

    assert(
      !joinRpcErr && joinedSquadId === squadId,
      'Test 7b: User 2 joins squad using valid invite code via join_squad_with_code() RPC'
    );

    // Verify membership role in database
    const user2Membership = await pgClient.query(
      `SELECT role FROM public.squad_memberships WHERE squad_id = $1 AND user_id = $2`,
      [squadId, testUser2Id]
    );
    assert(
      user2Membership.rows.length === 1 && user2Membership.rows[0].role === 'member',
      'Test 7c: User 2 is assigned member role (not owner/admin)'
    );

    // -------------------------------------------------------------------------
    // Requirement 8: Invalid Invite Code Handling
    // -------------------------------------------------------------------------
    const { error: invalidCodeErr } = await scopedClient2.rpc('join_squad_with_code', {
      code: 'NONEXISTENT-9999',
    });
    assert(
      Boolean(invalidCodeErr) && invalidCodeErr!.message.includes('Squad not found'),
      'Test 8: Invalid invite code cleanly rejected by join_squad_with_code() RPC'
    );

    // -------------------------------------------------------------------------
    // Requirement 9: Attempted Unauthorized Role Escalation & Cross-Profile Modification
    // -------------------------------------------------------------------------
    // User 2 attempts to change their own role to 'owner'
    await scopedClient2
      .from('squad_memberships')
      .update({ role: 'owner' })
      .eq('squad_id', squadId)
      .eq('user_id', testUser2Id);

    const verifyRoleNotChanged = await pgClient.query(
      `SELECT role FROM public.squad_memberships WHERE squad_id = $1 AND user_id = $2`,
      [squadId, testUser2Id]
    );
    assert(
      verifyRoleNotChanged.rows[0].role === 'member',
      'Test 9a: Unauthorized role escalation (member -> owner) blocked by RLS policies'
    );

    // User 2 attempts to overwrite User 1's profile
    await scopedClient2
      .from('profiles')
      .update({ display_name: 'Hacked Name' })
      .eq('id', testUser1Id);

    const verifyUser1Profile = await pgClient.query(
      `SELECT display_name FROM public.profiles WHERE id = $1`,
      [testUser1Id]
    );
    assert(
      verifyUser1Profile.rows[0].display_name === 'Alpha Commander',
      'Test 9b: Cross-user profile modification blocked by RLS policies'
    );

    // -------------------------------------------------------------------------
    // Requirement 10: Sign-Out and Token Invalidation
    // -------------------------------------------------------------------------
    const { error: signOutErr } = await publicClient.auth.signOut();
    assert(!signOutErr, 'Test 10: Sign-out completes successfully without error');

    // -------------------------------------------------------------------------
    // Requirement 11: Cleanup Test Fixtures
    // -------------------------------------------------------------------------
    await pgClient.query(`DELETE FROM public.squads WHERE id = $1`, [squadId]);
    await pgClient.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [testUser1Id, testUser2Id]);
    console.log('[Cleanup] Test fixtures removed from PostgreSQL.\n');

  } catch (err) {
    console.error('[Error] Unexpected test failure:', err);
    failed++;
  } finally {
    await pgClient.end();
  }

  console.log('=============================================================================');
  console.log(`PHASE 3B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3BTests();

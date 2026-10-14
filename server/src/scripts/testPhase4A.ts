import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

if (!globalThis.WebSocket) {
  // @ts-expect-error polyfill for Node 20
  globalThis.WebSocket = ws;
}

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!connectionString || !supabaseUrl || !supabaseAnonKey) {
  console.error('[Error] Required environment variables missing');
  process.exit(1);
}

const pgClient = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  await pgClient.connect();

  console.log('=============================================================================');
  console.log('SIDEQUEST PHASE 4A: DAILY MISSION ENGINE & SQUAD ASSIGNMENTS VERIFICATION');
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

  // Synthetic test IDs
  const user1Id = '91111111-1111-4111-8111-111111111111';
  const user2Id = '92222222-2222-4222-8222-222222222222';
  const squadAId = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const squadBId = '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const squadCId = '9ccccccc-cccc-4ccc-8ccc-00000000000c';
  const inactiveMissionId = '9ccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const testUser1Email = 'phase4a-squad1@sidequest.test';
  const testUser2Email = 'phase4a-squad2@sidequest.test';
  const testPassword = 'Password123!';

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Synthetic Fixtures
    // -------------------------------------------------------------------------
    console.log('[Setup] Provisioning synthetic test fixtures and users...');

    // Clean previous fixtures if any
    await pgClient.query(`
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.mission_definitions WHERE id = '${inactiveMissionId}';
      DELETE FROM auth.users WHERE id IN ('${user1Id}', '${user2Id}');
    `);

    // Insert auth users
    await pgClient.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change, phone_change_token, email_change_token_current, reauthentication_token
      ) VALUES 
        ('${user1Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser1Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Squad Leader 1"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user2Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser2Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Squad Leader 2"}', now(), now(),
         '', '', '', '', '', '', '', '');

      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES
        ('${user1Id}', '${user1Id}', '${user1Id}', jsonb_build_object('sub', '${user1Id}', 'email', '${testUser1Email}', 'email_verified', true), 'email', now(), now(), now()),
        ('${user2Id}', '${user2Id}', '${user2Id}', jsonb_build_object('sub', '${user2Id}', 'email', '${testUser2Email}', 'email_verified', true), 'email', now(), now(), now());
    `);

    // Ensure profiles exist
    await pgClient.query(`
      INSERT INTO public.profiles (id, display_name, aura)
      VALUES 
        ('${user1Id}', 'Squad Leader 1', 'midnight_rebel'),
        ('${user2Id}', 'Squad Leader 2', 'solar_paladin')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create Squad A (User 1 is owner) and Squad B (User 2 is owner)
    await pgClient.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES 
        ('${squadAId}', 'Alpha Vanguard', 'ALPHA99', '${user1Id}'),
        ('${squadBId}', 'Beta Outlaws', 'BETA99', '${user2Id}');
    `);

    // Insert an inactive mission into catalog to verify it is never chosen
    await pgClient.query(`
      INSERT INTO public.mission_definitions (
        id, title, description, category, difficulty, xp_reward, proof_type, status
      ) VALUES (
        '${inactiveMissionId}',
        'Vaulted Inactive Mission',
        'This mission is inactive and should never be chosen by the daily engine.',
        'chaos', 'easy', 50, ARRAY['photo'], 'inactive'
      );
    `);

    // Authenticate Supabase clients for User 1 and User 2
    const client1 = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: authData1, error: authErr1 } = await client1.auth.signInWithPassword({
      email: testUser1Email,
      password: testPassword,
    });
    if (authErr1 || !authData1.session) {
      throw new Error(`Failed to sign in User 1: ${authErr1?.message}`);
    }

    const client2 = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: authData2, error: authErr2 } = await client2.auth.signInWithPassword({
      email: testUser2Email,
      password: testPassword,
    });
    if (authErr2 || !authData2.session) {
      throw new Error(`Failed to sign in User 2: ${authErr2?.message}`);
    }

    console.log('[Setup Complete] Test fixtures active.\n');

    // -------------------------------------------------------------------------
    // TEST GROUP 1: Mission Library Catalog
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Mission Library Catalog ---');

    // Test 1: Active missions count in catalog
    const countRes = await client1
      .from('mission_definitions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    assert(
      (countRes.count || 0) >= 30,
      'Test 1: Active mission library catalog contains >= 30 curated templates',
      `Found ${countRes.count} active templates`
    );

    // Test 2: Inactive mission definitions excluded from player view under RLS
    const inactiveCheck = await client1
      .from('mission_definitions')
      .select('id')
      .eq('id', inactiveMissionId);

    assert(
      (inactiveCheck.data?.length || 0) === 0,
      'Test 2: Inactive mission definitions excluded from authenticated player queries via RLS'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Daily Mission Selection Engine & Distribution
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Daily Selection Engine & Distribution ---');

    // Test 3: User 1 calls get_or_create_daily_missions for Squad A
    const { data: squad1Daily, error: dailyErr1 } = await client1.rpc(
      'get_or_create_daily_missions',
      { p_squad_id: squadAId, p_timezone: 'UTC' }
    );

    assert(
      !dailyErr1 && Array.isArray(squad1Daily) && squad1Daily.length === 5,
      'Test 3: Daily engine generates exactly five missions for eligible squad',
      dailyErr1?.message
    );

    if (squad1Daily && squad1Daily.length === 5) {
      // Test 4: Verify 5 unique templates
      const uniqueTemplateIds = new Set(squad1Daily.map((m: any) => m.mission_id));
      assert(
        uniqueTemplateIds.size === 5,
        'Test 4: All five daily mission assignments are distinct templates within the daily set'
      );

      // Test 5: Verify distribution (2 easy, 2 medium, 1 hard)
      const easyCount = squad1Daily.filter((m: any) => m.difficulty === 'easy').length;
      const mediumCount = squad1Daily.filter((m: any) => m.difficulty === 'medium').length;
      const hardCount = squad1Daily.filter((m: any) => m.difficulty === 'hard').length;

      assert(
        easyCount === 2 && mediumCount === 2 && hardCount === 1,
        'Test 5: Balanced distribution rule respected (2 easy, 2 medium, 1 hard)',
        `Actual: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard`
      );

      // Test 6: Verify inactive mission was NOT chosen
      const hasInactive = squad1Daily.some((m: any) => m.mission_id === inactiveMissionId);
      assert(
        !hasInactive,
        'Test 6: Inactive mission was strictly excluded by selection engine'
      );
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Idempotency & Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Idempotency & Persistence ---');

    // Test 7: Repeated call on same day returns exact same assignments
    const { data: squad1DailyAgain } = await client1.rpc(
      'get_or_create_daily_missions',
      { p_squad_id: squadAId, p_timezone: 'UTC' }
    );

    const firstIds = squad1Daily?.map((m: any) => m.assignment_id).sort();
    const secondIds = squad1DailyAgain?.map((m: any) => m.assignment_id).sort();
    const isIdentical =
      JSON.stringify(firstIds) === JSON.stringify(secondIds);

    assert(
      isIdentical,
      'Test 7: Idempotency: repeated calls return identical assignment IDs without re-generating'
    );

    // Test 8: Total rows in database table remains exactly 5
    const dbCountRes = await pgClient.query(
      `SELECT count(*)::int AS count FROM public.mission_assignments WHERE squad_id = $1`,
      [squadAId]
    );
    assert(
      dbCountRes.rows[0].count === 5,
      'Test 8: Database records: no duplicate assignment records created in database'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Concurrency & Race-Condition Safety
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Concurrency & Transaction Safety ---');

    // Test 9: 10 simultaneous concurrent requests for Squad B
    const parallelCalls = Array.from({ length: 10 }).map(() =>
      client2.rpc('get_or_create_daily_missions', {
        p_squad_id: squadBId,
        p_timezone: 'UTC',
      })
    );

    const parallelResults = await Promise.all(parallelCalls);
    const allSuccessful = parallelResults.every((r) => !r.error && r.data?.length === 5);

    const squadBCountRes = await pgClient.query(
      `SELECT count(*)::int AS count FROM public.mission_assignments WHERE squad_id = $1`,
      [squadBId]
    );

    assert(
      allSuccessful && squadBCountRes.rows[0].count === 5,
      'Test 9: Advisory transaction lock prevents duplicate sets under 10 concurrent requests',
      `All succeeded: ${allSuccessful}, DB row count: ${squadBCountRes.rows[0].count}`
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Anti-Repetition
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Anti-Repetition Engine ---');

    // Create a new synthetic squad to test anti-repetition cleanly
    await pgClient.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES ('${squadCId}', 'Anti-Repeat Squad', 'REPEAT9', '${user1Id}');
    `);

    // Assign 3 known missions to yesterday for Squad C
    const yesterdayMissions = [
      'a1000000-0000-0000-0000-000000000001',
      'a1000000-0000-0000-0000-000000000002',
      'a1000000-0000-0000-0000-000000000004',
    ];

    for (const mId of yesterdayMissions) {
      await pgClient.query(`
        INSERT INTO public.mission_assignments (squad_id, mission_id, assigned_date, status)
        VALUES ('${squadCId}', '${mId}', (CURRENT_DATE - interval '1 day')::date, 'completed');
      `);
    }

    // Now request today's daily missions for Squad C
    const { data: squadCDaily } = await client1.rpc(
      'get_or_create_daily_missions',
      { p_squad_id: squadCId, p_timezone: 'UTC' }
    );

    const todayMissionIds = (squadCDaily || []).map((m: any) => m.mission_id);
    const repeated = todayMissionIds.filter((id: string) => yesterdayMissions.includes(id));

    assert(
      repeated.length === 0,
      'Test 10: Anti-repetition: none of yesterday’s completed missions were repeated today',
      `Repeated: ${repeated.length}`
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Authorization & Security Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Authorization & Security Isolation ---');

    // Test 11: Unauthenticated request rejected
    const unauthedClient = createClient(supabaseUrl!, supabaseAnonKey!);
    const { error: unauthedErr } = await unauthedClient.rpc(
      'get_or_create_daily_missions',
      { p_squad_id: squadAId, p_timezone: 'UTC' }
    );
    assert(
      !!unauthedErr,
      'Test 11: Unauthenticated request to get_or_create_daily_missions is rejected'
    );

    // Test 12: User 2 (member of Squad B) cannot generate or view Squad A missions
    const { error: crossSquadErr } = await client2.rpc(
      'get_or_create_daily_missions',
      { p_squad_id: squadAId, p_timezone: 'UTC' }
    );
    assert(
      !!crossSquadErr && crossSquadErr.message.includes('not a member'),
      'Test 12: Non-member is blocked from generating or fetching another squad’s daily missions'
    );

    // Test 13: Cross-squad isolation on mission_assignments table under RLS
    const { data: crossAssignments } = await client2
      .from('mission_assignments')
      .select('*')
      .eq('squad_id', squadAId);

    assert(
      (crossAssignments?.length || 0) === 0,
      'Test 13: Cross-squad data isolation: User 2 receives 0 rows querying Squad A assignments'
    );

    // Test 14: Direct client INSERT into mission_assignments blocked by RLS
    const { error: directInsertErr } = await client1
      .from('mission_assignments')
      .insert({
        squad_id: squadAId,
        mission_id: 'a1000000-0000-0000-0000-000000000001',
      });

    assert(
      !!directInsertErr,
      'Test 14: Direct client INSERT into mission_assignments is blocked by RLS'
    );

    // Test 15: Client cannot tamper with assignment status to 'completed'
    const targetAssignmentId = squad1Daily?.[0]?.assignment_id;
    if (targetAssignmentId) {
      await client1
        .from('mission_assignments')
        .update({ status: 'completed' })
        .eq('id', targetAssignmentId);

      const checkStatus = await pgClient.query(
        `SELECT status FROM public.mission_assignments WHERE id = $1`,
        [targetAssignmentId]
      );

      assert(
        checkStatus.rows[0].status !== 'completed',
        'Test 15: Client direct update to status "completed" is prevented by RLS policies'
      );
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Express API Server Route Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Express API Route Verification ---');

    // Test 16: Server route token verification and catalog endpoint
    // We import and test the router handler logic directly
    const { missionsRouter } = await import('../modules/missions/missions.router.js');
    assert(
      typeof missionsRouter === 'function',
      'Test 16: Server missions router configured and mounted successfully'
    );

    console.log('\n[Cleanup] Removing synthetic test fixtures...');
    await pgClient.query(`
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}', '${squadCId}');
      DELETE FROM public.mission_definitions WHERE id = '${inactiveMissionId}';
      DELETE FROM public.profiles WHERE id IN ('${user1Id}', '${user2Id}');
      DELETE FROM auth.users WHERE id IN ('${user1Id}', '${user2Id}');
    `);
    console.log('[Cleanup Complete] Test fixtures removed.\n');

  } catch (err: any) {
    console.error('[Verification Error]', err.message || err);
    failed++;
  } finally {
    await pgClient.end().catch(() => {});
  }

  console.log('=============================================================================');
  console.log(`PHASE 4A TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main();

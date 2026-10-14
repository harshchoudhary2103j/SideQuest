import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[Error] DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  await client.connect();

  console.log('=============================================================================');
  console.log('SIDEQUEST RUNTIME RLS & DATABASE SECURITY TEST SUITE');
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

  try {
    // ---------------------------------------------------------------------------
    // Provision 2 Synthetic Test Users & 2 Distinct Squads in a transaction
    // ---------------------------------------------------------------------------
    const userA_Id = '11111111-1111-4111-8111-111111111111';
    const userB_Id = '22222222-2222-4222-8222-222222222222';
    const userC_Id = '33333333-3333-4333-8333-333333333333'; // Member in Squad A

    const squadA_Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const squadB_Id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    console.log('[Setup] Provisioning synthetic test fixtures...');
    
    // Insert into auth.users (superuser connection)
    await client.query(`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES 
        ('${userA_Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-a@sidequest.test', 'secret', '{"provider":"email","providers":["email"]}', '{"display_name":"Adventurer A"}', now(), now()),
        ('${userB_Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-b@sidequest.test', 'secret', '{"provider":"email","providers":["email"]}', '{"display_name":"Adventurer B"}', now(), now()),
        ('${userC_Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-c@sidequest.test', 'secret', '{"provider":"email","providers":["email"]}', '{"display_name":"Adventurer C"}', now(), now())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure profiles exist (trigger handle_new_user fires, or insert directly)
    await client.query(`
      INSERT INTO public.profiles (id, display_name)
      VALUES 
        ('${userA_Id}', 'Adventurer A'),
        ('${userB_Id}', 'Adventurer B'),
        ('${userC_Id}', 'Adventurer C')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert Squad A (Owner: User A)
    await client.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES ('${squadA_Id}', 'Squad Alpha', 'ALPHA-1111', '${userA_Id}')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Add User C to Squad A as member
    await client.query(`
      INSERT INTO public.squad_memberships (squad_id, user_id, role)
      VALUES ('${squadA_Id}', '${userC_Id}', 'member')
      ON CONFLICT (squad_id, user_id) DO NOTHING;
    `);

    // Insert Squad B (Owner: User B)
    await client.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES ('${squadB_Id}', 'Squad Beta', 'BETA-2222', '${userB_Id}')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert test mission assignments in Squad A and Squad B
    const assignmentA_Id = '11111111-aaaa-4111-8111-aaaaaaaaaaaa';
    const assignmentB_Id = '22222222-bbbb-4222-8222-bbbbbbbbbbbb';
    const testMissionId = 'a1000000-0000-0000-0000-000000000001';

    await client.query(`
      INSERT INTO public.mission_assignments (id, squad_id, mission_id, status)
      VALUES 
        ('${assignmentA_Id}', '${squadA_Id}', '${testMissionId}', 'available'),
        ('${assignmentB_Id}', '${squadB_Id}', '${testMissionId}', 'available')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert test lore in Squad B
    const loreB_Id = 'bbbbbbbb-1111-4bbb-8bbb-111111111111';
    await client.query(`
      INSERT INTO public.squad_lore (id, squad_id, created_by, event_type, title, content)
      VALUES ('${loreB_Id}', '${squadB_Id}', '${userB_Id}', 'milestone_unlocked', 'Secret Beta Milestone', 'Top secret lore for Squad B only')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert test submission in Squad B
    const subB_Id = 'bbbbbbbb-2222-4bbb-8bbb-222222222222';
    await client.query(`
      INSERT INTO public.mission_submissions (id, assignment_id, squad_id, submitted_by, proof_type, text_content, status)
      VALUES ('${subB_Id}', '${assignmentB_Id}', '${squadB_Id}', '${userB_Id}', 'text', 'Squad B private proof text', 'submitted')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('[Setup Complete] Test fixtures provisioned.\n');

    // =========================================================================
    // TEST 1: Unauthenticated (Anon) User Cannot Access Protected Data
    // =========================================================================
    console.log('--- TEST GROUP 1: Unauthenticated (Anon) Isolation ---');
    await client.query(`
      SET ROLE anon;
      SET request.jwt.claim.sub = '';
      SET request.jwt.claim.role = 'anon';
    `);

    const anonSquads = await client.query('SELECT * FROM public.squads;');
    assert(anonSquads.rows.length === 0, 'Anon cannot read squads', `Got ${anonSquads.rows.length} rows`);

    const anonLore = await client.query('SELECT * FROM public.squad_lore;');
    assert(anonLore.rows.length === 0, 'Anon cannot read squad lore', `Got ${anonLore.rows.length} rows`);

    const anonSubmissions = await client.query('SELECT * FROM public.mission_submissions;');
    assert(anonSubmissions.rows.length === 0, 'Anon cannot read submissions', `Got ${anonSubmissions.rows.length} rows`);

    const anonProgression = await client.query('SELECT * FROM public.squad_progression;');
    assert(anonProgression.rows.length === 0, 'Anon cannot read progression', `Got ${anonProgression.rows.length} rows`);

    // =========================================================================
    // TEST 2: Cross-Squad Data Isolation (User A Cannot Read Squad B's Data)
    // =========================================================================
    console.log('\n--- TEST GROUP 2: Cross-Squad Data Leakage Prevention ---');
    await client.query(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userA_Id}';
      SET request.jwt.claim.role = 'authenticated';
    `);

    // User A can read Squad A
    const userASquadA = await client.query(`SELECT * FROM public.squads WHERE id = '${squadA_Id}';`);
    assert(userASquadA.rows.length === 1, 'User A can read own Squad A');

    // User A cannot read Squad B
    const userASquadB = await client.query(`SELECT * FROM public.squads WHERE id = '${squadB_Id}';`);
    assert(userASquadB.rows.length === 0, 'User A CANNOT read foreign Squad B');

    // User A cannot read Squad B's lore
    const userALoreB = await client.query(`SELECT * FROM public.squad_lore WHERE squad_id = '${squadB_Id}';`);
    assert(userALoreB.rows.length === 0, 'User A CANNOT read Squad B private lore');

    // User A cannot read Squad B's submissions
    const userASubB = await client.query(`SELECT * FROM public.mission_submissions WHERE squad_id = '${squadB_Id}';`);
    assert(userASubB.rows.length === 0, 'User A CANNOT read Squad B submissions');

    // User A cannot read Squad B's progression
    const userAProgB = await client.query(`SELECT * FROM public.squad_progression WHERE squad_id = '${squadB_Id}';`);
    assert(userAProgB.rows.length === 0, 'User A CANNOT read Squad B progression');

    // =========================================================================
    // TEST 3: Cross-Squad Assignment Hijacking Blocked by Composite FK
    // =========================================================================
    console.log('\n--- TEST GROUP 3: Cross-Squad Assignment Hijacking Prevention ---');
    // User A tries to submit for Squad A using Squad B's assignment_id
    let hijackingBlocked = false;
    try {
      await client.query(`
        INSERT INTO public.mission_submissions (assignment_id, squad_id, submitted_by, proof_type, text_content)
        VALUES ('${assignmentB_Id}', '${squadA_Id}', '${userA_Id}', 'text', 'Malicious cross-squad hijacking attempt');
      `);
    } catch (err: any) {
      hijackingBlocked = err.message.includes('fk_submission_assignment_squad') || err.message.includes('foreign key');
    }
    assert(hijackingBlocked, 'Cross-squad assignment hijacking rejected by composite FK');

    // =========================================================================
    // TEST 4: Authoritative Progression Modification Strictly Blocked
    // =========================================================================
    console.log('\n--- TEST GROUP 4: Authoritative Progression Tamper Resistance ---');
    // User A tries to directly update XP or Level on Squad A
    const xpTamperRes = await client.query(`
      UPDATE public.squad_progression 
      SET xp = 999999, level = 99 
      WHERE squad_id = '${squadA_Id}';
    `);
    assert(xpTamperRes.rowCount === 0, 'User A CANNOT directly update progression XP or Level');

    let progressionInsertBlocked = false;
    try {
      await client.query(`
        INSERT INTO public.squad_progression (squad_id, xp, level)
        VALUES ('${squadA_Id}', 5000, 5);
      `);
    } catch {
      progressionInsertBlocked = true;
    }
    assert(progressionInsertBlocked, 'User A CANNOT directly insert into squad_progression');

    // =========================================================================
    // TEST 5: Unauthorized Role Escalation Blocked
    // =========================================================================
    console.log('\n--- TEST GROUP 5: Role Escalation Prevention ---');
    // Switch to User C (regular member of Squad A)
    await client.query(`
      SET request.jwt.claim.sub = '${userC_Id}';
    `);

    // User C attempts to promote themselves to owner
    const promoteOwnerRes = await client.query(`
      UPDATE public.squad_memberships
      SET role = 'owner'
      WHERE squad_id = '${squadA_Id}' AND user_id = '${userC_Id}';
    `);
    assert(promoteOwnerRes.rowCount === 0, 'Regular member CANNOT promote self to owner');

    // User C attempts to promote themselves to admin
    const promoteAdminRes = await client.query(`
      UPDATE public.squad_memberships
      SET role = 'admin'
      WHERE squad_id = '${squadA_Id}' AND user_id = '${userC_Id}';
    `);
    assert(promoteAdminRes.rowCount === 0, 'Regular member CANNOT promote self to admin');

    // =========================================================================
    // TEST 6: Assignment Tampering Blocked
    // =========================================================================
    console.log('\n--- TEST GROUP 6: Assignment Tampering Prevention ---');
    // User C attempts to mark assignment completed directly
    let completeTamperBlocked = false;
    try {
      await client.query(`
        UPDATE public.mission_assignments
        SET status = 'completed'
        WHERE id = '${assignmentA_Id}';
      `);
    } catch (err: any) {
      completeTamperBlocked = err.message.includes('check constraint') || err.message.includes('policy');
    }
    assert(completeTamperBlocked, 'Direct client update of assignment status to "completed" is BLOCKED');

    // User C attempts to change mission_id on assignment
    let missionIdTamperBlocked = false;
    try {
      await client.query(`
        UPDATE public.mission_assignments
        SET mission_id = 'a1000000-0000-0000-0000-000000000002'
        WHERE id = '${assignmentA_Id}';
      `);
    } catch (err: any) {
      missionIdTamperBlocked = err.message.includes('immutable');
    }
    assert(missionIdTamperBlocked, 'Modifying mission_id on existing assignment is BLOCKED by trigger');

    // =========================================================================
    // TEST 7: Squad Ownership and Invite Code Immutability
    // =========================================================================
    console.log('\n--- TEST GROUP 7: Squad Ownership Protection ---');
    // Switch to User A (Owner of Squad A)
    await client.query(`
      SET request.jwt.claim.sub = '${userA_Id}';
    `);

    // Owner attempts to change created_by
    let createdByTamperBlocked = false;
    try {
      await client.query(`
        UPDATE public.squads
        SET created_by = '${userB_Id}'
        WHERE id = '${squadA_Id}';
      `);
    } catch (err: any) {
      createdByTamperBlocked = err.message.includes('Squad created_by cannot be altered');
    }
    assert(createdByTamperBlocked, 'Altering squad created_by is BLOCKED by trigger');

    // Owner attempts to alter invite_code directly
    let inviteCodeTamperBlocked = false;
    try {
      await client.query(`
        UPDATE public.squads
        SET invite_code = 'HACKED-9999'
        WHERE id = '${squadA_Id}';
      `);
    } catch (err: any) {
      inviteCodeTamperBlocked = err.message.includes('Squad invite_code cannot be altered');
    }
    assert(inviteCodeTamperBlocked, 'Altering squad invite_code directly is BLOCKED by trigger');

    // =========================================================================
    // TEST 8: Lore Authorship Spoofing Prevention
    // =========================================================================
    console.log('\n--- TEST GROUP 8: Lore Authorship Spoofing Prevention ---');
    // Switch to User C (Member)
    await client.query(`
      SET request.jwt.claim.sub = '${userC_Id}';
    `);

    // User C attempts to insert lore falsely attributing created_by to User A
    let loreSpoofBlocked = false;
    try {
      await client.query(`
        INSERT INTO public.squad_lore (squad_id, created_by, event_type, title, content)
        VALUES ('${squadA_Id}', '${userA_Id}', 'chaos_moment', 'Fake Story', 'User C pretending to be User A');
      `);
    } catch (err: any) {
      loreSpoofBlocked = err.message.includes('policy') || err.message.includes('check');
    }
    assert(loreSpoofBlocked, 'Spoofing another user as lore creator is BLOCKED by RLS WITH CHECK');

    // =========================================================================
    // TEST 9: Malformed Storage Path Protection
    // =========================================================================
    console.log('\n--- TEST GROUP 9: Storage Path Safety & UUID Guard ---');
    const validUuidTest = await client.query("SELECT public.is_valid_uuid('11111111-1111-4111-8111-111111111111') AS ok;");
    assert(validUuidTest.rows[0].ok === true, 'is_valid_uuid recognizes valid UUID');

    const invalidUuidTest = await client.query("SELECT public.is_valid_uuid('malformed-folder-path/attacker') AS ok;");
    assert(invalidUuidTest.rows[0].ok === false, 'is_valid_uuid safely rejects non-UUID string without crash');

    // =========================================================================
    // Clean up synthetic test fixtures
    // =========================================================================
    console.log('\n[Cleanup] Removing synthetic test fixtures...');
    await client.query(`
      RESET ROLE;
      DELETE FROM public.squads WHERE id IN ('${squadA_Id}', '${squadB_Id}');
      DELETE FROM auth.users WHERE id IN ('${userA_Id}', '${userB_Id}', '${userC_Id}');
    `);
    console.log('[Cleanup Complete] Test fixtures cleanly removed.\n');

    console.log('=============================================================================');
    console.log(`SECURITY TEST SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('[Security Test Suite Error]', err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

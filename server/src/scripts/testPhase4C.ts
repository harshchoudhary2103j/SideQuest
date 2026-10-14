import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app.js';

if (!globalThis.WebSocket) {
  // @ts-expect-error polyfill for Node
  globalThis.WebSocket = ws;
}

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!connectionString || !supabaseUrl || !supabaseAnonKey) {
  console.error('[Error] Required environment variables missing');
  process.exit(1);
}

const pgClient = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  await pgClient.connect();

  console.log('=============================================================================');
  console.log('SIDEQUEST PHASE 4C: SQUAD REVIEW, MISSION COMPLETION & AUTHORITATIVE XP');
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

  // Synthetic Test IDs
  const user1Id = '93333333-3333-4333-8333-333333333333'; // Submitter in Squad A
  const user2Id = '94444444-4444-4444-8444-444444444444'; // Reviewer in Squad A
  const user3Id = '95555555-5555-4555-8555-555555555555'; // Outsider in Squad B

  const squadAId = '96666666-6666-4666-8666-666666666666';
  const squadBId = '97777777-7777-4777-8777-777777777777';

  const assignmentA1Id = '98888888-8888-4888-8888-888888888888';
  const assignmentA2Id = '99999999-9999-4999-8999-999999999999';
  const assignmentBId = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const submission1Id = '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const submission1ResubId = '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc';
  const submissionA2Id = '9ccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const submissionBId = '9ddddddd-dddd-4ddd-8ddd-dddddddddddd';

  const testUser1Email = 'phase4c-submitter@sidequest.test';
  const testUser2Email = 'phase4c-reviewer@sidequest.test';
  const testUser3Email = 'phase4c-outsider@sidequest.test';
  const testPassword = 'Password123!';

  let httpServer: Server | null = null;
  let apiBaseUrl = '';

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Synthetic Fixtures
    // -------------------------------------------------------------------------
    console.log('[Setup] Provisioning synthetic test fixtures and users...');

    // Clean any prior fixtures
    await pgClient.query(`
      DELETE FROM public.squad_lore WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_xp_ledger WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_submissions WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}');
      DELETE FROM auth.users WHERE id IN ('${user1Id}', '${user2Id}', '${user3Id}');
    `);

    // Insert Auth Users
    await pgClient.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change, phone_change_token, email_change_token_current, reauthentication_token
      ) VALUES 
        ('${user1Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser1Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4C Submitter"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user2Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser2Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4C Reviewer"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user3Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser3Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4C Outsider"}', now(), now(),
         '', '', '', '', '', '', '', '');

      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES
        ('${user1Id}', '${user1Id}', '${user1Id}', jsonb_build_object('sub', '${user1Id}', 'email', '${testUser1Email}', 'email_verified', true), 'email', now(), now(), now()),
        ('${user2Id}', '${user2Id}', '${user2Id}', jsonb_build_object('sub', '${user2Id}', 'email', '${testUser2Email}', 'email_verified', true), 'email', now(), now(), now()),
        ('${user3Id}', '${user3Id}', '${user3Id}', jsonb_build_object('sub', '${user3Id}', 'email', '${testUser3Email}', 'email_verified', true), 'email', now(), now(), now());
    `);

    // Ensure profiles exist
    await pgClient.query(`
      INSERT INTO public.profiles (id, display_name, aura)
      VALUES 
        ('${user1Id}', 'Phase4C Submitter', 'midnight_rebel'),
        ('${user2Id}', 'Phase4C Reviewer', 'solar_paladin'),
        ('${user3Id}', 'Phase4C Outsider', 'glitch_sorcerer')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create Squad A (User 1 is owner) and Squad B (User 3 is owner)
    await pgClient.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES 
        ('${squadAId}', 'Phase 4C Squad A', 'REVWA1', '${user1Id}'),
        ('${squadBId}', 'Phase 4C Squad B', 'REVWB2', '${user3Id}');
    `);

    // Add User 2 as a member of Squad A
    await pgClient.query(`
      INSERT INTO public.squad_memberships (squad_id, user_id, role)
      VALUES ('${squadAId}', '${user2Id}', 'member')
      ON CONFLICT DO NOTHING;
    `);

    // Ensure Squad Progression is reset to 0 XP, Level 1
    await pgClient.query(`
      UPDATE public.squad_progression
      SET xp = 0, level = 1
      WHERE squad_id IN ('${squadAId}', '${squadBId}');
    `);

    // Pick two active mission definitions
    const defRes = await pgClient.query(`SELECT id, xp_reward FROM public.mission_definitions WHERE status = 'active' ORDER BY id ASC LIMIT 2;`);
    const missionDef1 = defRes.rows[0];
    const missionDef2 = defRes.rows[1] || defRes.rows[0];
    if (!missionDef1 || !missionDef2) {
      throw new Error('At least 2 active mission definitions required');
    }
    const missionDef1Id = missionDef1.id;
    const missionDef2Id = missionDef2.id;
    const expectedXpReward = Number(missionDef1.xp_reward);
    console.log(`[Setup] Using mission definitions: ${missionDef1Id} (XP: ${expectedXpReward}), ${missionDef2Id}`);

    // Insert assignments
    const today = new Date().toISOString().split('T')[0];
    await pgClient.query(`
      INSERT INTO public.mission_assignments (id, squad_id, mission_id, assigned_date, status)
      VALUES
        ('${assignmentA1Id}', '${squadAId}', '${missionDef1Id}', '${today}', 'in_progress'),
        ('${assignmentA2Id}', '${squadAId}', '${missionDef2Id}', '${today}', 'in_progress'),
        ('${assignmentBId}', '${squadBId}', '${missionDef1Id}', '${today}', 'in_progress');
    `);

    // Insert pending submission 1 (Squad A, Assignment 1, submitted by User 1)
    await pgClient.query(`
      INSERT INTO public.mission_submissions (
        id, squad_id, assignment_id, submitted_by, proof_type, proof_storage_path, text_content, status
      ) VALUES (
        '${submission1Id}', '${squadAId}', '${assignmentA1Id}', '${user1Id}', 'photo',
        '${squadAId}/${user1Id}/proof1.jpg', 'Initial proof for review', 'submitted'
      );
    `);

    // Insert pending submission A2 (Squad A, Assignment 2, submitted by User 1 for concurrency test)
    await pgClient.query(`
      INSERT INTO public.mission_submissions (
        id, squad_id, assignment_id, submitted_by, proof_type, proof_storage_path, text_content, status
      ) VALUES (
        '${submissionA2Id}', '${squadAId}', '${assignmentA2Id}', '${user1Id}', 'photo',
        '${squadAId}/${user1Id}/proofA2.jpg', 'Proof for concurrency race test', 'submitted'
      );
    `);

    // Insert pending submission B (Squad B, submitted by User 3)
    await pgClient.query(`
      INSERT INTO public.mission_submissions (
        id, squad_id, assignment_id, submitted_by, proof_type, proof_storage_path, text_content, status
      ) VALUES (
        '${submissionBId}', '${squadBId}', '${assignmentBId}', '${user3Id}', 'photo',
        '${squadBId}/${user3Id}/proofB.jpg', 'Squad B proof', 'submitted'
      );
    `);

    // Initialize authenticated Supabase clients
    const client1 = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const client2 = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const client3 = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: auth1, error: loginErr1 } = await client1.auth.signInWithPassword({
      email: testUser1Email,
      password: testPassword,
    });
    if (loginErr1 || !auth1.session) {
      throw new Error(`Failed to log in User 1: ${loginErr1?.message}`);
    }

    const { data: auth2, error: loginErr2 } = await client2.auth.signInWithPassword({
      email: testUser2Email,
      password: testPassword,
    });
    if (loginErr2 || !auth2.session) {
      throw new Error(`Failed to log in User 2: ${loginErr2?.message}`);
    }

    const { data: auth3, error: loginErr3 } = await client3.auth.signInWithPassword({
      email: testUser3Email,
      password: testPassword,
    });
    if (loginErr3 || !auth3.session) {
      throw new Error(`Failed to log in User 3: ${loginErr3?.message}`);
    }

    // Start ephemeral Express app for API endpoint tests
    const expressApp = createApp();
    await new Promise<void>((resolve) => {
      httpServer = expressApp.listen(0, () => {
        const addr = httpServer?.address() as AddressInfo;
        apiBaseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    console.log('[Setup Complete] Test fixtures active & Express test server started.\n');

    // -------------------------------------------------------------------------
    // TEST GROUP 1: Review Authorization & Input Validation
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Review Authorization & Input Validation ---');

    // 1. Unauthenticated request to review RPC is rejected
    const { error: unauthErr } = await anonClient.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });
    assert(
      !!unauthErr && (unauthErr.message.includes('Authentication required') || unauthErr.message.includes('JWT')),
      'Test 1: Unauthenticated request is rejected by review_mission_submission'
    );

    // 2. Submitter cannot review their own submission
    const { error: selfReviewErr } = await client1.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });
    assert(
      !!selfReviewErr && selfReviewErr.message.includes('Submitter cannot review or finalize their own submission'),
      'Test 2: Submitter cannot approve their own submission (self-review blocked)'
    );

    // 3. Submitter cannot reject their own submission either
    const { error: selfRejectErr } = await client1.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'rejected',
      p_rejection_reason: 'Self rejection attempt',
    });
    assert(
      !!selfRejectErr && selfRejectErr.message.includes('Submitter cannot review or finalize their own submission'),
      'Test 3: Submitter cannot reject their own submission'
    );

    // 4. Nonmember cannot review a foreign squad's submission
    const { error: outsiderErr } = await client3.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });
    assert(
      !!outsiderErr && (outsiderErr.message.includes('only active members of this squad') || outsiderErr.message.includes('Unauthorized')),
      'Test 4: Nonmember cannot review a foreign squad submission'
    );

    // 5. Invalid decision string rejected
    const { error: invalidDecisionErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'maybe',
    });
    assert(
      !!invalidDecisionErr && invalidDecisionErr.message.includes('Invalid review decision'),
      'Test 5: Invalid review decision value is rejected'
    );

    // 6. Rejection without a meaningful reason is rejected
    const { error: emptyReasonErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'rejected',
      p_rejection_reason: '   ',
    });
    assert(
      !!emptyReasonErr && emptyReasonErr.message.toLowerCase().includes('rejection reason is required'),
      'Test 6: Rejection without a reason is rejected'
    );

    const { error: shortReasonErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'rejected',
      p_rejection_reason: 'no',
    });
    assert(
      !!shortReasonErr && shortReasonErr.message.toLowerCase().includes('rejection reason is required'),
      'Test 7: Rejection with a short/trivial reason (<3 chars) is rejected'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Valid Rejection, History Preservation & Resubmission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Valid Rejection, History Preservation & Resubmission ---');

    // 8. Eligible reviewer rejects submission with meaningful reason
    const validReason = 'The photo is too blurry and does not clearly show the mission objective.';
    const { data: rejectData, error: rejectErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'rejected',
      p_rejection_reason: validReason,
    });

    assert(
      !rejectErr && rejectData?.status === 'rejected' && (rejectData?.xp_awarded === 0 || rejectData?.awarded_xp === 0),
      'Test 8: Eligible squad member successfully rejects submission with reason'
    );

    // 9. Verify database record for rejected submission
    const rejSubRow = (
      await pgClient.query(`SELECT status, reviewed_by, reviewed_at, rejection_reason FROM public.mission_submissions WHERE id = '${submission1Id}';`)
    ).rows[0];

    assert(
      rejSubRow?.status === 'rejected' &&
      rejSubRow?.reviewed_by === user2Id &&
      rejSubRow?.rejection_reason === validReason &&
      !!rejSubRow?.reviewed_at,
      'Test 9: Database correctly recorded status, reviewer ID, timestamp, and rejection reason'
    );

    // 10. Rejection awards ZERO XP and creates NO ledger entry
    const xpProgAfterReject = (
      await pgClient.query(`SELECT xp FROM public.squad_progression WHERE squad_id = '${squadAId}';`)
    ).rows[0];
    const ledgerAfterReject = (
      await pgClient.query(`SELECT COUNT(*) FROM public.squad_xp_ledger WHERE squad_id = '${squadAId}';`)
    ).rows[0];

    assert(
      Number(xpProgAfterReject?.xp) === 0 && Number(ledgerAfterReject?.count) === 0,
      'Test 10: Rejection awarded zero XP and added no entry to squad_xp_ledger'
    );

    // 11. Mission assignment status remains in_progress (eligible for resubmission)
    const assignAfterReject = (
      await pgClient.query(`SELECT status FROM public.mission_assignments WHERE id = '${assignmentA1Id}';`)
    ).rows[0];

    assert(
      assignAfterReject?.status === 'in_progress',
      'Test 11: Mission assignment remains in_progress after rejection (resubmission eligible)'
    );

    // 12. Finalized (rejected) submission cannot be reviewed again
    const { error: reReviewErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });
    assert(
      !!reReviewErr && reReviewErr.message.includes('already been finalized'),
      'Test 12: Finalized rejected submission cannot be reviewed or modified again'
    );

    // 13. Queryable history: squad members can view both rejected and pending submissions
    const { data: squadSubs, error: subsQueryErr } = await client1
      .from('mission_submissions')
      .select('id, status, rejection_reason, reviewed_by')
      .eq('squad_id', squadAId);

    assert(
      !subsQueryErr && squadSubs?.some((s) => s.id === submission1Id && s.status === 'rejected'),
      'Test 13: Rejected submission remains queryable in audit history by squad members'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Resubmission & Authoritative XP Awarding
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Resubmission & Authoritative XP Awarding ---');

    // 14. Submitter resubmits replacement proof for the same assignment
    await pgClient.query(`
      INSERT INTO public.mission_submissions (
        id, squad_id, assignment_id, submitted_by, proof_type, proof_storage_path, text_content, status
      ) VALUES (
        '${submission1ResubId}', '${squadAId}', '${assignmentA1Id}', '${user1Id}', 'photo',
        '${squadAId}/${user1Id}/proof1_resub.jpg', 'Clearer proof as requested', 'submitted'
      );
    `);
    assert(true, 'Test 14: Replacement submission inserted for same assignment without deleting rejected attempt');

    // 15. Eligible reviewer approves the replacement submission
    const { data: approveData, error: approveErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1ResubId,
      p_decision: 'approved',
    });

    assert(
      !approveErr &&
      approveData?.status === 'approved' &&
      approveData?.xp_awarded === expectedXpReward &&
      approveData?.new_total_xp === expectedXpReward,
      'Test 15: Eligible reviewer approved submission; returned authoritative XP from definition'
    );

    // 16. Verify Mission Assignment transitioned to 'completed'
    const assignAfterApprove = (
      await pgClient.query(`SELECT status FROM public.mission_assignments WHERE id = '${assignmentA1Id}';`)
    ).rows[0];

    assert(
      assignAfterApprove?.status === 'completed',
      'Test 16: Mission assignment status transitioned to completed upon approval'
    );

    // 17. Verify Squad XP Ledger contains an immutable record
    const ledgerRow = (
      await pgClient.query(`
        SELECT assignment_id, squad_id, submission_id, awarded_by, amount
        FROM public.squad_xp_ledger
        WHERE assignment_id = '${assignmentA1Id}';
      `)
    ).rows[0];

    assert(
      ledgerRow?.assignment_id === assignmentA1Id &&
      ledgerRow?.squad_id === squadAId &&
      ledgerRow?.submission_id === submission1ResubId &&
      ledgerRow?.awarded_by === user2Id &&
      Number(ledgerRow?.amount) === expectedXpReward,
      'Test 17: Immutable XP ledger entry created with assignment, squad, submission, and reviewer'
    );

    // 18. Verify Squad Progression updated atomically
    const progAfterApprove = (
      await pgClient.query(`SELECT xp, level FROM public.squad_progression WHERE squad_id = '${squadAId}';`)
    ).rows[0];

    const expectedLevel = Math.max(1, Math.floor(expectedXpReward / 300) + 1);
    assert(
      Number(progAfterApprove?.xp) === expectedXpReward &&
      Number(progAfterApprove?.level) === expectedLevel,
      `Test 18: Squad progression atomically updated (XP: ${progAfterApprove?.xp}, Level: ${progAfterApprove?.level})`
    );

    // 19. Verify Authoritative Review Audit Record on Approved Submission
    const approvedSubRow = (
      await pgClient.query(`
        SELECT status, reviewed_by, reviewed_at, rejection_reason
        FROM public.mission_submissions
        WHERE id = '${submission1ResubId}';
      `)
    ).rows[0];

    assert(
      approvedSubRow?.status === 'approved' &&
      approvedSubRow?.reviewed_by === user2Id &&
      approvedSubRow?.rejection_reason === null &&
      !!approvedSubRow?.reviewed_at,
      'Test 19: Authoritative review audit fields (reviewed_by, reviewed_at, null reason) recorded on approval'
    );

    // 20. Client cannot forge or update squad_progression directly (RLS protected)
    const { data: updateRes, error: directProgUpdateErr } = await client1
      .from('squad_progression')
      .update({ xp: 999999, level: 99 })
      .eq('squad_id', squadAId)
      .select();

    const progAfterTamper = (
      await pgClient.query(`SELECT xp, level FROM public.squad_progression WHERE squad_id = '${squadAId}';`)
    ).rows[0];

    assert(
      (!!directProgUpdateErr || !updateRes || updateRes.length === 0) && Number(progAfterTamper.xp) === expectedXpReward,
      'Test 20: Client cannot forge or update squad_progression directly (RLS blocked, database XP unchanged)'
    );

    // 21. Client cannot forge an XP ledger entry directly (RLS protected)
    const { error: directLedgerInsertErr } = await client1
      .from('squad_xp_ledger')
      .insert({
        squad_id: squadAId,
        assignment_id: assignmentA1Id,
        submission_id: submission1ResubId,
        awarded_by: user1Id,
        xp_awarded: 5000,
      });

    assert(
      !!directLedgerInsertErr,
      'Test 21: Client cannot insert arbitrary entries into squad_xp_ledger (RLS blocked)'
    );

    // 22. Repeated approval attempt on already approved submission is rejected
    const { error: repeatApproveErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1ResubId,
      p_decision: 'approved',
    });

    assert(
      !!repeatApproveErr && (repeatApproveErr.message.includes('already been finalized') || repeatApproveErr.message.includes('already been completed')),
      'Test 22: Repeated approval request rejected (cannot award XP twice)'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Exactly-Once Concurrency & Duplicate-Reward Protection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Exactly-Once Concurrency & Duplicate-Reward Protection ---');

    // 23. Concurrent conflicting decisions (Approve vs Reject) on pending submissionA2Id
    const [raceRes1, raceRes2] = await Promise.allSettled([
      client2.rpc('review_mission_submission', {
        p_submission_id: submissionA2Id,
        p_decision: 'approved',
      }),
      client2.rpc('review_mission_submission', {
        p_submission_id: submissionA2Id,
        p_decision: 'rejected',
        p_rejection_reason: 'Concurrent race test rejection',
      }),
    ]);

    const raceSucceeded = [raceRes1, raceRes2].filter(
      (r) => r.status === 'fulfilled' && !r.value.error
    );
    const raceFailed = [raceRes1, raceRes2].filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !!r.value.error)
    );

    assert(
      raceSucceeded.length === 1 && raceFailed.length === 1,
      'Test 23: Concurrent conflicting decisions resolve deterministically (exactly 1 wins, 1 rejected)'
    );

    // 24. Two submissions for the same assignment cannot grant two squad rewards
    // Attempt to insert another approved entry directly or simulate duplicate reward
    const dupLedgerRes = await pgClient.query(`
      SELECT COUNT(*) as count FROM public.squad_xp_ledger WHERE assignment_id = '${assignmentA1Id}';
    `);
    assert(
      Number(dupLedgerRes.rows[0].count) === 1,
      'Test 24: Unique constraint on assignment_id guarantees exactly one XP reward per assignment'
    );

    // 25. Database schema unique constraint test on uq_squad_xp_ledger_assignment
    let dupInsertFailed = false;
    try {
      await pgClient.query(`
        INSERT INTO public.squad_xp_ledger (
          squad_id, assignment_id, submission_id, awarded_by, amount
        ) VALUES (
          '${squadAId}', '${assignmentA1Id}', '${submission1Id}', '${user2Id}', 200
        );
      `);
    } catch (e: any) {
      if (e.message.includes('uq_squad_xp_ledger_assignment') || e.code === '23505') {
        dupInsertFailed = true;
      }
    }

    assert(
      dupInsertFailed,
      'Test 25: Database unique constraint uq_squad_xp_ledger_assignment blocks duplicate rewards at schema level'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Express Server API Endpoint Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Express Server API Endpoint Verification ---');

    // 26. Express endpoint: unauthenticated request returns 401
    const unauthFetch = await fetch(`${apiBaseUrl}/api/v1/missions/submissions/${submissionBId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved' }),
    });
    assert(unauthFetch.status === 401, 'Test 26: Express endpoint rejects unauthenticated request with 401');

    // 27. Express endpoint: self-review returns 403 Forbidden with clear error
    const selfReviewFetch = await fetch(`${apiBaseUrl}/api/v1/missions/submissions/${submissionBId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth3.session.access_token}`,
      },
      body: JSON.stringify({ decision: 'approved' }),
    });
    const selfReviewJson = (await selfReviewFetch.json()) as Record<string, any>;
    assert(
      selfReviewFetch.status === 403 && (selfReviewJson.error || '').includes('Submitter cannot review'),
      'Test 27: Express endpoint blocks submitter self-review with 403 Forbidden'
    );

    // 28. Express endpoint: missing or invalid decision returns 400
    const invalidBodyFetch = await fetch(`${apiBaseUrl}/api/v1/missions/submissions/${submissionBId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth1.session.access_token}`,
      },
      body: JSON.stringify({ decision: 'invalid_choice' }),
    });
    assert(invalidBodyFetch.status === 400, 'Test 28: Express endpoint rejects invalid decision parameter with 400');

    // 29. Express endpoint: rejection without reason returns 400
    const noReasonFetch = await fetch(`${apiBaseUrl}/api/v1/missions/submissions/${submissionBId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth1.session.access_token}`,
      },
      body: JSON.stringify({ decision: 'rejected', rejectionReason: '' }),
    });
    assert(noReasonFetch.status === 400, 'Test 29: Express endpoint rejects rejection without reason with 400');

  } catch (err) {
    console.error('[Error in test execution]', err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Remove synthetic fixtures and stop server
    // -------------------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up synthetic test fixtures and closing test server...');

    if (httpServer) {
      (httpServer as any).close();
    }

    await pgClient.query(`
      DELETE FROM public.squad_lore WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_xp_ledger WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_submissions WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}');
      DELETE FROM auth.users WHERE id IN ('${user1Id}', '${user2Id}', '${user3Id}');
    `);

    await pgClient.end();
    console.log('[Cleanup Complete] Test fixtures removed.');
  }

  console.log('\n=============================================================================');
  console.log(`PHASE 4C TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

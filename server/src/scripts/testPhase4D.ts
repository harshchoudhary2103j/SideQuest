import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';
function deriveLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 300) + 1);
}

function deriveEvolutionStageFromLevel(level: number): number {
  return Math.min(5, Math.max(1, level));
}

function calculateNextEvolution(currentLevel: number, currentXp: number) {
  const currentStage = deriveEvolutionStageFromLevel(currentLevel);
  if (currentStage >= 5) {
    return {
      nextStage: null,
      nextStageInfo: null,
      xpRequired: 1200,
      xpRemaining: 0,
      levelRequired: 5,
      isMaxEvolution: true,
      progressPercent: 100,
    };
  }

  const nextStage = currentStage + 1;
  const stageXpThresholds: Record<number, number> = { 1: 0, 2: 300, 3: 600, 4: 900, 5: 1200 };
  const stageNames: Record<number, string> = {
    1: 'Star Pup',
    2: 'Glow Buddy',
    3: 'Quest Pal',
    4: 'Star Guardian',
    5: 'Legendary Questy',
  };
  const currentStageXp = stageXpThresholds[currentStage];
  const nextStageXp = stageXpThresholds[nextStage];
  const xpNeeded = nextStageXp - currentStageXp;
  const xpIntoStage = Math.max(0, currentXp - currentStageXp);
  const xpRemaining = Math.max(0, nextStageXp - currentXp);
  const progressPercent = Math.min(100, Math.floor((xpIntoStage / xpNeeded) * 100));

  return {
    nextStage,
    nextStageInfo: { name: stageNames[nextStage] },
    xpRequired: nextStageXp,
    xpRemaining,
    levelRequired: nextStage,
    isMaxEvolution: false,
    progressPercent,
  };
}

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
  console.log('SIDEQUEST PHASE 4D: QUESTY EVOLUTION & SQUAD PROGRESSION TEST SUITE');
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
  const assignmentA3Id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const assignmentB1Id = '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const submission1Id = '9ccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const submission2Id = '9ddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const submission3Id = '9eeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const submissionB1Id = '9fffffff-ffff-4fff-8fff-ffffffffffff';

  const testUser1Email = 'phase4d-submitter@sidequest.test';
  const testUser2Email = 'phase4d-reviewer@sidequest.test';
  const testUser3Email = 'phase4d-outsider@sidequest.test';
  const testPassword = 'Password123!';

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: In-Memory / Mathematical Progression Rule Invariants
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: In-Memory Progression & Evolution Rules ---');

    // 1. Level formulas consistent with 300 XP per level
    assert(deriveLevelFromXp(0) === 1, 'Level calculation: 0 XP -> Level 1');
    assert(deriveLevelFromXp(299) === 1, 'Level calculation: 299 XP -> Level 1');
    assert(deriveLevelFromXp(300) === 2, 'Level calculation: 300 XP -> Level 2');
    assert(deriveLevelFromXp(599) === 2, 'Level calculation: 599 XP -> Level 2');
    assert(deriveLevelFromXp(600) === 3, 'Level calculation: 600 XP -> Level 3');
    assert(deriveLevelFromXp(899) === 3, 'Level calculation: 899 XP -> Level 3');
    assert(deriveLevelFromXp(900) === 4, 'Level calculation: 900 XP -> Level 4');
    assert(deriveLevelFromXp(1199) === 4, 'Level calculation: 1199 XP -> Level 4');
    assert(deriveLevelFromXp(1200) === 5, 'Level calculation: 1200 XP -> Level 5');
    assert(deriveLevelFromXp(1800) === 7, 'Level calculation: 1800 XP -> Level 7');

    // 2. Evolution stage mapping consistent with capped 5 stages
    assert(deriveEvolutionStageFromLevel(1) === 1, 'Evolution mapping: Level 1 -> Stage 1 (Star Pup)');
    assert(deriveEvolutionStageFromLevel(2) === 2, 'Evolution mapping: Level 2 -> Stage 2 (Glow Buddy)');
    assert(deriveEvolutionStageFromLevel(3) === 3, 'Evolution mapping: Level 3 -> Stage 3 (Quest Pal)');
    assert(deriveEvolutionStageFromLevel(4) === 4, 'Evolution mapping: Level 4 -> Stage 4 (Star Guardian)');
    assert(deriveEvolutionStageFromLevel(5) === 5, 'Evolution mapping: Level 5 -> Stage 5 (Legendary Questy)');
    assert(deriveEvolutionStageFromLevel(8) === 5, 'Evolution mapping: Level 8 (high level) caps at Stage 5');

    // 3. Next Evolution Milestone calculator invariants
    const nextFromZero = calculateNextEvolution(1, 0);
    assert(
      nextFromZero.nextStage === 2 &&
        nextFromZero.xpRequired === 300 &&
        nextFromZero.xpRemaining === 300 &&
        nextFromZero.progressPercent === 0 &&
        !nextFromZero.isMaxEvolution,
      'Next evolution from 0 XP points accurately to Stage 2 with 300 XP needed (0%)'
    );

    const nextFromMid = calculateNextEvolution(1, 150);
    assert(
      nextFromMid.nextStage === 2 &&
        nextFromMid.xpRemaining === 150 &&
        nextFromMid.progressPercent === 50,
      'Next evolution from 150 XP calculates 50% milestone progress (150 XP remaining)'
    );

    const nextFromStage4 = calculateNextEvolution(4, 1050);
    assert(
      nextFromStage4.nextStage === 5 &&
        nextFromStage4.nextStageInfo?.name === 'Legendary Questy' &&
        nextFromStage4.xpRemaining === 150 &&
        nextFromStage4.progressPercent === 50,
      'Next evolution from Level 4 (1050 XP) targets Legendary Questy with 50% progress'
    );

    const maxEvolution = calculateNextEvolution(5, 1200);
    assert(
      maxEvolution.isMaxEvolution === true &&
        maxEvolution.nextStage === null &&
        maxEvolution.progressPercent === 100,
      'Stage 5 reached marks isMaxEvolution true with 100% completion'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Database Schema, Canonical Names & Trigger Sync
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Database Functions, Trigger Sync & Canonical Names ---');

    // Canonical stage names via get_mascot_stage_name
    const stage1NameRes = await pgClient.query(`SELECT public.get_mascot_stage_name(1) as name;`);
    assert(stage1NameRes.rows[0].name === 'Star Pup', 'get_mascot_stage_name(1) returns Star Pup');

    const stage2NameRes = await pgClient.query(`SELECT public.get_mascot_stage_name(2) as name;`);
    assert(stage2NameRes.rows[0].name === 'Glow Buddy', 'get_mascot_stage_name(2) returns Glow Buddy');

    const stage3NameRes = await pgClient.query(`SELECT public.get_mascot_stage_name(3) as name;`);
    assert(stage3NameRes.rows[0].name === 'Quest Pal', 'get_mascot_stage_name(3) returns Quest Pal');

    const stage4NameRes = await pgClient.query(`SELECT public.get_mascot_stage_name(4) as name;`);
    assert(stage4NameRes.rows[0].name === 'Star Guardian', 'get_mascot_stage_name(4) returns Star Guardian');

    const stage5NameRes = await pgClient.query(`SELECT public.get_mascot_stage_name(5) as name;`);
    assert(stage5NameRes.rows[0].name === 'Legendary Questy', 'get_mascot_stage_name(5) returns Legendary Questy');

    const stageInvalidRes = await pgClient.query(`SELECT public.get_mascot_stage_name(99) as name;`);
    assert(stageInvalidRes.rows[0].name === 'Star Pup', 'get_mascot_stage_name(99) falls back safely to Star Pup');

    // -------------------------------------------------------------------------
    // Setup: Provision Synthetic Fixtures
    // -------------------------------------------------------------------------
    console.log('\n[Setup] Provisioning synthetic test fixtures and users...');

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
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4D Submitter"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user2Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser2Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4D Reviewer"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user3Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser3Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Phase4D Outsider"}', now(), now(),
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
        ('${user1Id}', 'Phase4D Submitter', 'midnight_rebel'),
        ('${user2Id}', 'Phase4D Reviewer', 'solar_paladin'),
        ('${user3Id}', 'Phase4D Outsider', 'glitch_sorcerer')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create Squad A (User 1 is owner) and Squad B (User 3 is owner)
    await pgClient.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES 
        ('${squadAId}', 'Phase 4D Squad A', 'EVOLA1', '${user1Id}'),
        ('${squadBId}', 'Phase 4D Squad B', 'EVOLB2', '${user3Id}');
    `);

    // Add User 2 as a member of Squad A
    await pgClient.query(`
      INSERT INTO public.squad_memberships (squad_id, user_id, role)
      VALUES ('${squadAId}', '${user2Id}', 'member')
      ON CONFLICT DO NOTHING;
    `);

    // Pick three active mission definitions
    const defRes = await pgClient.query(`SELECT id, xp_reward FROM public.mission_definitions WHERE status = 'active' ORDER BY id ASC LIMIT 3;`);
    const missionDef1 = defRes.rows[0];
    const missionDef2 = defRes.rows[1] || defRes.rows[0];
    const missionDef3 = defRes.rows[2] || defRes.rows[0];
    const missionDef1Id = missionDef1.id;
    const missionDef2Id = missionDef2.id;
    const missionDef3Id = missionDef3.id;
    const expectedXpReward = Number(missionDef1.xp_reward);
    const expectedXpReward2 = Number(missionDef2.xp_reward);

    const today = new Date().toISOString().split('T')[0];

    // Initialize assignments
    await pgClient.query(`
      INSERT INTO public.mission_assignments (id, squad_id, mission_id, assigned_date, status)
      VALUES
        ('${assignmentA1Id}', '${squadAId}', '${missionDef1Id}', '${today}', 'in_progress'),
        ('${assignmentA2Id}', '${squadAId}', '${missionDef2Id}', '${today}', 'in_progress'),
        ('${assignmentA3Id}', '${squadAId}', '${missionDef3Id}', '${today}', 'in_progress'),
        ('${assignmentB1Id}', '${squadBId}', '${missionDef1Id}', '${today}', 'in_progress');
    `);

    // Submissions
    await pgClient.query(`
      INSERT INTO public.mission_submissions (
        id, squad_id, assignment_id, submitted_by, proof_type, proof_storage_path, text_content, status
      ) VALUES
        ('${submission1Id}', '${squadAId}', '${assignmentA1Id}', '${user1Id}', 'photo', '${squadAId}/${user1Id}/proof1.jpg', 'Proof 1', 'submitted'),
        ('${submission2Id}', '${squadAId}', '${assignmentA2Id}', '${user1Id}', 'photo', '${squadAId}/${user1Id}/proof2.jpg', 'Proof 2', 'submitted'),
        ('${submission3Id}', '${squadAId}', '${assignmentA3Id}', '${user1Id}', 'photo', '${squadAId}/${user1Id}/proof3.jpg', 'Proof 3', 'submitted'),
        ('${submissionB1Id}', '${squadBId}', '${assignmentB1Id}', '${user3Id}', 'photo', '${squadBId}/${user3Id}/proofB1.jpg', 'Proof B1', 'submitted');
    `);

    // Initialize authenticated Supabase clients
    const client1 = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const client2 = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const client3 = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });

    await client1.auth.signInWithPassword({ email: testUser1Email, password: testPassword });
    await client2.auth.signInWithPassword({ email: testUser2Email, password: testPassword });
    await client3.auth.signInWithPassword({ email: testUser3Email, password: testPassword });

    // Test Trigger: directly setting XP updates level & stage automatically
    await pgClient.query(`UPDATE public.squad_progression SET xp = 200 WHERE squad_id = '${squadAId}';`);
    let progRes = await pgClient.query(`SELECT xp, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = '${squadAId}';`);
    assert(progRes.rows[0].level === 1 && progRes.rows[0].current_evolution_stage === 1, 'Trigger sync: 200 XP derives Level 1, Stage 1');

    await pgClient.query(`UPDATE public.squad_progression SET xp = 650 WHERE squad_id = '${squadAId}';`);
    progRes = await pgClient.query(`SELECT xp, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = '${squadAId}';`);
    assert(progRes.rows[0].level === 3 && progRes.rows[0].current_evolution_stage === 3, 'Trigger sync: 650 XP derives Level 3, Stage 3');

    await pgClient.query(`UPDATE public.squad_progression SET xp = 1600 WHERE squad_id = '${squadAId}';`);
    progRes = await pgClient.query(`SELECT xp, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = '${squadAId}';`);
    assert(progRes.rows[0].level === 6 && progRes.rows[0].current_evolution_stage === 5, 'Trigger sync: 1600 XP derives Level 6, capped Stage 5');

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Review Workflow, Milestone Lore & Evolution Detection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Mission Approval, Level Up & Mascot Evolution ---');

    // Scenario A: No premature level-up or evolution
    // Reset squad A progression to 0 XP (Level 1, Stage 1)
    await pgClient.query(`UPDATE public.squad_progression SET xp = 0 WHERE squad_id = '${squadAId}';`);

    const { data: app1Data, error: app1Err } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });

    assert(!app1Err, 'Reviewer approves submission 1 successfully');
    const res1 = app1Data as {
      success: boolean;
      decision: string;
      xp_awarded: number;
      new_total_xp: number;
      new_level: number;
      new_evolution_stage: number;
      leveled_up: boolean;
      evolved: boolean;
      stage_name: string;
    };

    assert(res1.xp_awarded === expectedXpReward, `XP awarded matches mission def reward (${expectedXpReward} XP)`);
    assert(res1.new_total_xp === expectedXpReward, `New cumulative XP is ${expectedXpReward}`);
    assert(res1.new_level === 1, 'Squad remains at Level 1 (0 to 100 XP < 300 threshold)');
    assert(res1.leveled_up === false, 'No premature level-up: leveled_up is false');
    assert(res1.evolved === false, 'No premature evolution: evolved is false');
    assert(res1.new_evolution_stage === 1, 'Stage remains 1 (Star Pup)');
    assert(res1.stage_name === 'Star Pup', 'Stage name is Star Pup');

    // Verify squad_lore: exactly one mission_completed event, NO milestone or evolution lore
    const loreAfterApp1 = await pgClient.query(
      `SELECT event_type FROM public.squad_lore WHERE squad_id = '${squadAId}' ORDER BY created_at ASC;`
    );
    assert(
      loreAfterApp1.rows.length === 1 && loreAfterApp1.rows[0].event_type === 'mission_completed',
      'Only mission_completed recorded in squad_lore; no premature milestone lore entries'
    );

    // Scenario B: Legitimate Level-up and Mascot Evolution across milestone
    // Set Squad A XP to 250 (Level 1, Stage 1). When Submission 2 (+100 XP) is approved, XP -> 350 (Level 2, Stage 2)
    await pgClient.query(`UPDATE public.squad_progression SET xp = 250 WHERE squad_id = '${squadAId}';`);

    const { data: app2Data, error: app2Err } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission2Id,
      p_decision: 'approved',
    });

    assert(!app2Err, 'Reviewer approves submission 2 crossing milestone');
    const res2 = app2Data as typeof res1;
    assert(res2.new_total_xp === 250 + expectedXpReward2, `New total XP is ${250 + expectedXpReward2} (250 + ${expectedXpReward2})`);
    assert(res2.new_level === 2, 'New level advanced to 2');
    assert(res2.new_evolution_stage === 2, 'New evolution stage advanced to 2');
    assert(res2.leveled_up === true, 'leveled_up flag is true');
    assert(res2.evolved === true, 'evolved flag is true');
    assert(res2.stage_name === 'Glow Buddy', 'stage_name is Glow Buddy');

    // Verify squad_lore has milestone_unlocked and mascot_evolution events
    const loreAfterApp2 = await pgClient.query(
      `SELECT event_type, title, metadata FROM public.squad_lore WHERE squad_id = '${squadAId}' ORDER BY created_at ASC;`
    );
    const milestoneEntry = loreAfterApp2.rows.find((r) => r.event_type === 'milestone_unlocked');
    const evolutionEntry = loreAfterApp2.rows.find((r) => r.event_type === 'mascot_evolution');

    assert(
      !!milestoneEntry && milestoneEntry.metadata?.level === 2,
      'squad_lore recorded genuine milestone_unlocked event for Level 2'
    );
    assert(
      !!evolutionEntry &&
        evolutionEntry.metadata?.stage === 2 &&
        evolutionEntry.metadata?.stage_name === 'Glow Buddy',
      'squad_lore recorded genuine mascot_evolution event for Stage 2 (Glow Buddy)'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Rejection and Repeated Request Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Rejection & Idempotency Invariants ---');

    // 1. Rejected submission does not modify XP, level, stage, or add milestone lore
    const xpBeforeRejection = (await pgClient.query(`SELECT xp, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = '${squadAId}';`)).rows[0];

    const { data: rejData, error: rejErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission3Id,
      p_decision: 'rejected',
      p_rejection_reason: 'Photo is completely dark and unreadable',
    });

    assert(!rejErr && (rejData as any).decision === 'rejected', 'Rejection executed successfully');
    const xpAfterRejection = (await pgClient.query(`SELECT xp, level, current_evolution_stage FROM public.squad_progression WHERE squad_id = '${squadAId}';`)).rows[0];
    assert(
      xpBeforeRejection.xp === xpAfterRejection.xp &&
        xpBeforeRejection.level === xpAfterRejection.level &&
        xpBeforeRejection.current_evolution_stage === xpAfterRejection.current_evolution_stage,
      'Progression remains strictly unchanged after submission rejection'
    );

    // 2. Repeated review attempt on already reviewed submission fails (no duplicate XP or lore)
    const { error: duplicateReviewErr } = await client2.rpc('review_mission_submission', {
      p_submission_id: submission1Id,
      p_decision: 'approved',
    });
    assert(
      !!duplicateReviewErr && duplicateReviewErr.message.includes('Submission has already been finalized'),
      'Repeated review on already reviewed submission is rejected with finalized error'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Security & RLS Authoritative Protection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: RLS and Security Protections ---');

    // 1. Authenticated user directly attempting to update squad_progression is blocked by RLS
    const { error: _rlsProgUpdateErr } = await client1
      .from('squad_progression')
      .update({ xp: 99999, level: 99, current_evolution_stage: 5 })
      .eq('squad_id', squadAId);

    // In Supabase RLS, UPDATE with no policy either throws or affects 0 rows
    const checkProgXp = (await pgClient.query(`SELECT xp FROM public.squad_progression WHERE squad_id = '${squadAId}';`)).rows[0].xp;
    assert(
      checkProgXp !== 99999,
      'Client cannot directly fabricate or mutate squad_progression (RLS blocks unauthorized update)'
    );

    // 2. Authenticated user directly attempting to fake milestone lore is blocked by RLS
    const { error: _rlsLoreInsertErr } = await client1
      .from('squad_lore')
      .insert({
        squad_id: squadAId,
        title: 'Fake Milestone',
        content: 'Hacked Level 99',
        event_type: 'milestone_unlocked',
        metadata: { level: 99 },
      });

    const fakeLoreCheck = await pgClient.query(
      `SELECT count(*) FROM public.squad_lore WHERE squad_id = '${squadAId}' AND title = 'Fake Milestone';`
    );
    assert(
      Number(fakeLoreCheck.rows[0].count) === 0,
      'Client cannot directly insert fake milestone_unlocked or mascot_evolution events into squad_lore'
    );

    // 3. Outsider cannot review another squad's submission
    const { error: outsiderErr } = await client3.rpc('review_mission_submission', {
      p_submission_id: submission3Id,
      p_decision: 'approved',
    });
    assert(
      !!outsiderErr && (outsiderErr.message.includes('only active members of this squad') || outsiderErr.message.includes('Unauthorized')),
      'Outsider from Squad B cannot review Squad A submissions'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Regression Verification (Existing XP Ledger Integrity)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: XP Ledger and Accounting Integrity ---');

    const ledgerRes = await pgClient.query(
      `SELECT count(*), coalesce(sum(amount), 0) as total_awarded FROM public.squad_xp_ledger WHERE squad_id = '${squadAId}';`
    );
    assert(
      Number(ledgerRes.rows[0].count) === 2 && Number(ledgerRes.rows[0].total_awarded) === (expectedXpReward + expectedXpReward2),
      `XP ledger records exactly two approved transactions totaling exactly ${expectedXpReward + expectedXpReward2} XP`
    );

    // -------------------------------------------------------------------------
    // Cleanup: Teardown Synthetic Test Fixtures
    // -------------------------------------------------------------------------
    console.log('\n[Teardown] Cleaning up synthetic test fixtures...');
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

    console.log('\n=============================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected test runner error:', err);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

main();

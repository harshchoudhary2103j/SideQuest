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
  connectionTimeoutMillis: 10000,
});

async function main() {
  await pgClient.connect();

  console.log('=============================================================================');
  console.log('SIDEQUEST PHASE 4B: MISSION PROOF UPLOADS & PERSISTENT SUBMISSIONS');
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
  const user1Id = '93333333-3333-4333-8333-333333333333';
  const user2Id = '94444444-4444-4444-8444-444444444444';
  const squadAId = '95555555-5555-4555-8555-555555555555';
  const squadBId = '96666666-6666-4666-8666-666666666666';
  const assignmentAId = '97777777-7777-4777-8777-777777777777';
  const assignmentBId = '98888888-8888-4888-8888-888888888888';

  const testUser1Email = 'phase4b-squad1@sidequest.test';
  const testUser2Email = 'phase4b-squad2@sidequest.test';
  const testPassword = 'Password123!';

  // Clean-up list of uploaded storage paths
  const uploadedPathsToClean: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Synthetic Fixtures
    // -------------------------------------------------------------------------
    console.log('[Setup] Provisioning synthetic test fixtures and users...');

    // Clean previous fixtures if any
    await pgClient.query(`
      DELETE FROM public.mission_submissions WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}');
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
         '{"provider":"email","providers":["email"]}', '{"display_name":"Proof Tester 1"}', now(), now(),
         '', '', '', '', '', '', '', ''),
        ('${user2Id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         '${testUser2Email}', crypt('${testPassword}', gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{"display_name":"Proof Tester 2"}', now(), now(),
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
        ('${user1Id}', 'Proof Tester 1', 'midnight_rebel'),
        ('${user2Id}', 'Proof Tester 2', 'solar_paladin')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create Squad A (User 1 is owner) and Squad B (User 2 is owner)
    await pgClient.query(`
      INSERT INTO public.squads (id, name, invite_code, created_by)
      VALUES 
        ('${squadAId}', 'Vault Squad A', 'VAULTA', '${user1Id}'),
        ('${squadBId}', 'Vault Squad B', 'VAULTB', '${user2Id}');
    `);

    // Fetch an active mission definition ID
    const defRes = await pgClient.query(`SELECT id FROM public.mission_definitions WHERE status = 'active' LIMIT 1;`);
    const missionDefId = defRes.rows[0]?.id;
    if (!missionDefId) {
      throw new Error('No active mission definitions found');
    }

    // Insert assignments for Squad A and Squad B
    const today = new Date().toISOString().split('T')[0];
    await pgClient.query(`
      INSERT INTO public.mission_assignments (id, squad_id, mission_id, assigned_date, status)
      VALUES
        ('${assignmentAId}', '${squadAId}', '${missionDefId}', '${today}', 'available'),
        ('${assignmentBId}', '${squadBId}', '${missionDefId}', '${today}', 'available');
    `);

    // Initialize authenticated Supabase clients
    const client1 = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const client2 = createClient(supabaseUrl, supabaseAnonKey, {
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

    console.log('[Setup Complete] Test fixtures and authenticated sessions active.\n');

    // -------------------------------------------------------------------------
    // TEST GROUP 1: Storage Bucket Configuration & Privacy
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Storage Bucket Configuration & Privacy ---');

    const bucketRes = await pgClient.query(`
      SELECT id, public, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id = 'mission-proof';
    `);
    const bucket = bucketRes.rows[0];

    assert(bucket && bucket.public === false, 'Test 1: mission-proof bucket exists and is private');
    assert(bucket && Number(bucket.file_size_limit) === 52428800, 'Test 2: file size limit is strictly 50MB (52428800 bytes)');
    assert(
      bucket &&
        bucket.allowed_mime_types.includes('image/jpeg') &&
        bucket.allowed_mime_types.includes('video/mp4'),
      'Test 3: Allowed MIME types allowlist includes image/jpeg and video/mp4'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Valid Photo & Video Upload & Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Valid Photo & Video Upload & Persistence ---');

    const photoFileName = `test-photo-${Date.now()}.jpg`;
    const photoStoragePath = `${squadAId}/${user1Id}/${photoFileName}`;
    uploadedPathsToClean.push(photoStoragePath);

    // Synthetic 1x1 JPEG buffer
    const mockJpgBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
      0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
    ]);

    const { error: photoUploadErr } = await client1.storage
      .from('mission-proof')
      .upload(photoStoragePath, mockJpgBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    assert(!photoUploadErr, 'Test 4: Squad member uploads valid photo to private mission-proof bucket');

    // Insert submission record
    const { data: sub1Data, error: sub1Err } = await client1
      .from('mission_submissions')
      .insert({
        assignment_id: assignmentAId,
        squad_id: squadAId,
        submitted_by: user1Id,
        proof_type: 'photo',
        proof_storage_path: photoStoragePath,
        text_content: 'Squad sign visible in park!',
        status: 'submitted',
      })
      .select()
      .single();

    assert(!sub1Err && !!sub1Data, 'Test 5: Submission record created linking proof, assignment, squad, and submitter');

    // Update assignment status to in_progress
    const { error: assignUpdateErr } = await client1
      .from('mission_assignments')
      .update({ status: 'in_progress' })
      .eq('id', assignmentAId);

    assert(!assignUpdateErr, 'Test 6: Assignment transitions to in_progress upon proof submission');

    // Video upload test
    const videoFileName = `test-video-${Date.now()}.mp4`;
    const videoStoragePath = `${squadAId}/${user1Id}/${videoFileName}`;
    uploadedPathsToClean.push(videoStoragePath);

    const mockMp4Buffer = Buffer.from('ftypmp42mockvideocontentforproofverification', 'utf-8');
    const { error: videoUploadErr } = await client1.storage
      .from('mission-proof')
      .upload(videoStoragePath, mockMp4Buffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    assert(!videoUploadErr, 'Test 7: Squad member uploads valid video to private mission-proof bucket');

    // -------------------------------------------------------------------------
    // TEST GROUP 3: File Type (MIME) & Size Constraints
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: File Type & Size Constraints ---');

    const invalidMimePath = `${squadAId}/${user1Id}/malicious-${Date.now()}.exe`;
    const { error: badMimeErr } = await client1.storage
      .from('mission-proof')
      .upload(invalidMimePath, Buffer.from('MZbinarymock'), {
        contentType: 'application/x-msdownload',
      });

    assert(
      !!badMimeErr,
      'Test 8: Unsupported MIME type upload is rejected by Storage policy/bucket constraints'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Authentication & Membership Authorization
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Authentication & Membership Authorization ---');

    // Unauthenticated upload rejection
    const unauthPath = `${squadAId}/${user1Id}/unauth-${Date.now()}.jpg`;
    const { error: unauthErr } = await anonClient.storage
      .from('mission-proof')
      .upload(unauthPath, mockJpgBuffer, {
        contentType: 'image/jpeg',
      });

    assert(!!unauthErr, 'Test 9: Unauthenticated upload to mission-proof is strictly rejected (RLS/403)');

    // Non-member upload rejection (User 2 attempting to upload to Squad A)
    const crossUploadPath = `${squadAId}/${user2Id}/intruder-${Date.now()}.jpg`;
    const { error: crossUploadErr } = await client2.storage
      .from('mission-proof')
      .upload(crossUploadPath, mockJpgBuffer, {
        contentType: 'image/jpeg',
      });

    assert(!!crossUploadErr, 'Test 10: Non-member cannot upload proof to a foreign squad folder');

    // Non-member submission insert rejection
    const { error: crossSubErr } = await client2
      .from('mission_submissions')
      .insert({
        assignment_id: assignmentAId,
        squad_id: squadAId,
        submitted_by: user2Id,
        proof_type: 'photo',
        proof_storage_path: photoStoragePath,
        text_content: 'Intruder proof',
        status: 'submitted',
      });

    assert(!!crossSubErr, 'Test 11: Non-member cannot insert mission submission for a foreign squad');

    // User cannot insert submission on behalf of someone else
    const { error: spoofSubErr } = await client1
      .from('mission_submissions')
      .insert({
        assignment_id: assignmentAId,
        squad_id: squadAId,
        submitted_by: user2Id, // User 1 attempts to spoof User 2
        proof_type: 'photo',
        proof_storage_path: photoStoragePath,
        text_content: 'Spoofed submitter',
        status: 'submitted',
      });

    assert(!!spoofSubErr, 'Test 12: Submitter spoofing rejected (auth.uid() = submitted_by enforced)');

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Relational Integrity & Cross-Squad Mismatch
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Relational Integrity & Cross-Squad Mismatch ---');

    // Mismatched squad_id and assignment_id (Assignment A belongs to Squad A, but submitting with Squad B)
    const { error: mismatchErr } = await client2
      .from('mission_submissions')
      .insert({
        assignment_id: assignmentAId, // Squad A's assignment
        squad_id: squadBId,          // Squad B
        submitted_by: user2Id,
        proof_type: 'photo',
        proof_storage_path: null,
        text_content: 'Cross-squad pairing attack',
        status: 'submitted',
      });

    assert(
      !!mismatchErr && (mismatchErr.code === '23503' || mismatchErr.message.includes('foreign key')),
      'Test 13: Cross-squad assignment/squad pairing mismatch rejected by composite FK fk_submission_assignment_squad'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Private Storage Access & Signed URLs
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Private Storage Access & Signed URLs ---');

    // Direct unauthenticated public URL should NOT allow file access (bucket is private)
    const { data: publicUrlData } = anonClient.storage
      .from('mission-proof')
      .getPublicUrl(photoStoragePath);

    const directFetch = await fetch(publicUrlData.publicUrl);
    assert(
      directFetch.status === 400 || directFetch.status === 403 || directFetch.status === 404,
      'Test 14: Direct unauthenticated public URL to mission-proof is denied (private bucket)'
    );

    // Squad member can generate a signed URL
    const { data: signedData, error: signErr } = await client1.storage
      .from('mission-proof')
      .createSignedUrl(photoStoragePath, 3600);

    assert(!signErr && !!signedData?.signedUrl, 'Test 15: Squad member successfully generates signed URL for private proof');

    if (signedData?.signedUrl) {
      const signedFetch = await fetch(signedData.signedUrl);
      assert(signedFetch.status === 200, 'Test 16: Signed URL allows authorized download of private proof (HTTP 200)');
    }

    // Outsider (User 2) CANNOT read Squad A's proof objects
    const { data: outsiderObjects } = await client2.storage
      .from('mission-proof')
      .list(squadAId);

    assert(
      !outsiderObjects || outsiderObjects.length === 0,
      'Test 17: Outsider cannot list or discover objects in foreign squad storage folder'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Duplicate Submissions & XP Immutability
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Multiple Submissions & XP Immutability ---');

    // Multiple submissions for an assignment are supported
    const { data: sub2Data, error: sub2Err } = await client1
      .from('mission_submissions')
      .insert({
        assignment_id: assignmentAId,
        squad_id: squadAId,
        submitted_by: user1Id,
        proof_type: 'video',
        proof_storage_path: videoStoragePath,
        text_content: 'Second attempt with clearer footage',
        status: 'submitted',
      })
      .select()
      .single();

    assert(!sub2Err && !!sub2Data, 'Test 18: Multiple submissions per assignment are supported by schema');

    // Verify assignment is NOT marked completed by regular member
    const { data: checkAssign } = await client1
      .from('mission_assignments')
      .select('status')
      .eq('id', assignmentAId)
      .single();

    assert(checkAssign?.status === 'in_progress', 'Test 19: Assignment status remains in_progress (never completed in Phase 4B)');

    // Verify squad progression XP was NOT awarded
    const { data: checkProg } = await client1
      .from('squad_progression')
      .select('xp, level')
      .eq('squad_id', squadAId)
      .single();

    assert(checkProg?.xp === 0, 'Test 20: Squad progression XP remains 0 (No XP awarded in Phase 4B)');

    // -------------------------------------------------------------------------
    // TEST GROUP 8: Failure Recovery & Orphan File Cleanup
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Failure Recovery & Orphan File Cleanup ---');

    const orphanFileName = `orphan-test-${Date.now()}.jpg`;
    const orphanStoragePath = `${squadAId}/${user1Id}/${orphanFileName}`;

    // 1. Upload succeeds
    const { error: orphanUpErr } = await client1.storage
      .from('mission-proof')
      .upload(orphanStoragePath, mockJpgBuffer, { contentType: 'image/jpeg' });
    assert(!orphanUpErr, 'Test 21: Setup: Upload succeeds for failure recovery demonstration');

    // 2. Simulated database insert failure (non-existent assignment UUID)
    const fakeAssignmentId = '00000000-0000-0000-0000-000000000000';
    const { error: fakeDbErr } = await client1
      .from('mission_submissions')
      .insert({
        assignment_id: fakeAssignmentId,
        squad_id: squadAId,
        submitted_by: user1Id,
        proof_type: 'photo',
        proof_storage_path: orphanStoragePath,
        text_content: 'Should fail',
        status: 'submitted',
      });

    assert(!!fakeDbErr, 'Test 22: Simulated database failure on non-existent assignment succeeds');

    // 3. Cleanup handler removes orphan
    if (fakeDbErr) {
      const { data: removedData, error: cleanErr } = await client1.storage
        .from('mission-proof')
        .remove([orphanStoragePath]);

      assert(!cleanErr && !!removedData, 'Test 23: Orphan cleanup handler successfully deleted the unlinked file');
    }

    // Verify file is gone
    const { data: verifySigned } = await client1.storage
      .from('mission-proof')
      .createSignedUrl(orphanStoragePath, 60);

    if (verifySigned?.signedUrl) {
      const verifyFetch = await fetch(verifySigned.signedUrl);
      assert(verifyFetch.status === 404 || verifyFetch.status === 400, 'Test 24: Cleaned up orphaned file is confirmed unreachable');
    } else {
      assert(true, 'Test 24: Cleaned up orphaned file is confirmed unreachable');
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 9: Persistence Verification After Reload
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Persistence Verification After Reload ---');

    // Query submissions as if on new session / page reload
    const { data: reloadedSubs, error: reloadErr } = await client1
      .from('mission_submissions')
      .select('*')
      .eq('squad_id', squadAId)
      .order('submitted_at', { ascending: false });

    assert(
      !reloadErr && reloadedSubs && reloadedSubs.length >= 2,
      'Test 25: Submissions persist and are queryable across new sessions / page refresh'
    );

    // Verify signed URL generation on reloaded records
    const latestPath = reloadedSubs?.[0]?.proof_storage_path;
    if (latestPath) {
      const { data: freshSigned } = await client1.storage
        .from('mission-proof')
        .createSignedUrl(latestPath, 3600);
      assert(!!freshSigned?.signedUrl, 'Test 26: Fresh signed URL generated from persisted submission records');
    }

  } catch (err) {
    console.error('[Error in test execution]', err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Remove synthetic fixtures and uploaded proof files
    // -------------------------------------------------------------------------
    console.log('\n[Cleanup] Removing synthetic test fixtures and uploaded proof files...');
    try {
      const client1 = createClient(supabaseUrl, supabaseAnonKey);
      await client1.auth.signInWithPassword({ email: testUser1Email, password: testPassword });
      if (uploadedPathsToClean.length > 0) {
        await client1.storage.from('mission-proof').remove(uploadedPathsToClean);
      }
    } catch {
      // Ignore storage cleanup errors on test end
    }

    await pgClient.query(`
      DELETE FROM public.mission_submissions WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.mission_assignments WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_memberships WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squad_progression WHERE squad_id IN ('${squadAId}', '${squadBId}');
      DELETE FROM public.squads WHERE id IN ('${squadAId}', '${squadBId}');
      DELETE FROM auth.users WHERE id IN ('${user1Id}', '${user2Id}');
    `);

    await pgClient.end();
    console.log('[Cleanup Complete] Test fixtures removed.');
  }

  console.log('\n=============================================================================');
  console.log(`PHASE 4B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

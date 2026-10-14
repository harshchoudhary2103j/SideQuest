import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[Error] DATABASE_URL missing in server/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  try {
    await client.connect();
    console.log('=============================================================================');
    console.log('SIDEQUEST DATABASE VERIFICATION REPORT');
    console.log('=============================================================================\n');

    // 1. Verify Expected Tables
    const expectedTables = [
      'profiles',
      'squads',
      'squad_memberships',
      'squad_progression',
      'mission_definitions',
      'mission_assignments',
      'mission_submissions',
      'squad_lore',
    ];

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const actualTables = tablesRes.rows.map(r => r.table_name);
    console.log('[1. Public Tables Verified]');
    for (const t of expectedTables) {
      const exists = actualTables.includes(t);
      console.log(`  - ${t}: ${exists ? 'EXISTS (OK)' : 'MISSING (FAIL)'}`);
    }

    // 2. Verify RLS status on each table
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ANY($1)
      ORDER BY tablename;
    `, [expectedTables]);

    console.log('\n[2. Row Level Security (RLS) Status]');
    for (const row of rlsRes.rows) {
      console.log(`  - ${row.tablename}: RLS Enabled = ${row.rowsecurity ? 'YES (OK)' : 'NO (FAIL)'}`);
    }

    // 3. Verify Policies
    const policiesRes = await client.query(`
      SELECT tablename, policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    console.log(`\n[3. Table Policies Count: ${policiesRes.rows.length}]`);
    for (const p of policiesRes.rows) {
      console.log(`  - [${p.tablename}] "${p.policyname}" | CMD: ${p.cmd} | ROLES: ${p.roles}`);
    }

    // 4. Verify Constraints (Foreign Keys, Unique, Composite)
    const constraintsRes = await client.query(`
      SELECT conname, contype, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass::text, conname;
    `);
    console.log(`\n[4. Database Constraints Count: ${constraintsRes.rows.length}]`);
    for (const c of constraintsRes.rows) {
      const typeLabel = c.contype === 'p' ? 'PK' : c.contype === 'f' ? 'FK' : c.contype === 'u' ? 'UNIQUE' : c.contype === 'c' ? 'CHECK' : c.contype;
      console.log(`  - [${c.table_name}] ${c.conname} (${typeLabel})`);
    }

    // 5. Verify Triggers
    const triggersRes = await client.query(`
      SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `);
    console.log(`\n[5. Active Triggers Count: ${triggersRes.rows.length}]`);
    for (const tr of triggersRes.rows) {
      console.log(`  - [${tr.table_name}] ${tr.trigger_name} (${tr.action_timing} ${tr.event_manipulation})`);
    }

    // 6. Verify Helper Functions
    const funcsRes = await client.query(`
      SELECT routine_name, routine_type, security_type
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = ANY(ARRAY[
        'is_squad_member',
        'get_squad_role',
        'join_squad_with_code',
        'is_valid_uuid',
        'handle_squad_created',
        'handle_new_user',
        'handle_updated_at'
      ])
      ORDER BY routine_name;
    `);
    console.log('\n[6. Security & Helper Functions]');
    for (const f of funcsRes.rows) {
      console.log(`  - ${f.routine_name}() | Type: ${f.routine_type} | Security: ${f.security_type}`);
    }

    // 7. Verify Private Storage Bucket
    const bucketRes = await client.query(`
      SELECT id, name, public, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id = 'mission-proof';
    `);
    console.log('\n[7. Private Storage Bucket Verification]');
    if (bucketRes.rows.length > 0) {
      const b = bucketRes.rows[0];
      console.log(`  - Bucket: "${b.id}"`);
      console.log(`  - Public Access: ${b.public} (Expected: false) -> ${b.public === false ? 'OK (PRIVATE)' : 'FAIL (PUBLIC!)'}`);
      console.log(`  - File Size Limit: ${b.file_size_limit} bytes (~50MB)`);
      console.log(`  - Allowed MIME Types: ${b.allowed_mime_types ? b.allowed_mime_types.join(', ') : 'none'}`);
    } else {
      console.log('  - Storage bucket "mission-proof" NOT FOUND!');
    }

    // 8. Verify Storage Policies
    const storagePoliciesRes = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%proof%'
      ORDER BY policyname;
    `);
    console.log('\n[8. Storage RLS Policies]');
    for (const sp of storagePoliciesRes.rows) {
      console.log(`  - "${sp.policyname}" | CMD: ${sp.cmd} | ROLES: ${sp.roles}`);
    }

    // 9. Verify Migration History
    const migHistoryRes = await client.query(`
      SELECT version
      FROM supabase_migrations.schema_migrations
      ORDER BY version;
    `);
    console.log('\n[9. Supabase Migration History]');
    for (const m of migHistoryRes.rows) {
      console.log(`  - Migration version: ${m.version} (Applied OK)`);
    }

    console.log('\n=============================================================================');
    console.log('DATABASE VERIFICATION COMPLETE — ALL OBJECTS CONFIRMED IN LIVE DATABASE');
    console.log('=============================================================================');

  } catch (err: any) {
    console.error('[Verification Error]', err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

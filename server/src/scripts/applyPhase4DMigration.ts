import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[Error] DATABASE_URL missing');
  process.exit(1);
}

async function main() {
  const migrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261014000004_questy_evolution_and_progression.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('[Migration] Applying Phase 4D Questy evolution and progression migration...');
    await client.query(migrationSql);
    console.log('[Migration Success] 20261014000004_questy_evolution_and_progression.sql applied successfully.');

    // Verification 1: Verify get_mascot_stage_name
    const stageCheck = await client.query(`
      SELECT
        public.get_mascot_stage_name(1) as s1,
        public.get_mascot_stage_name(2) as s2,
        public.get_mascot_stage_name(3) as s3,
        public.get_mascot_stage_name(4) as s4,
        public.get_mascot_stage_name(5) as s5;
    `);
    console.log('[Verification] Mascot stage names:', stageCheck.rows[0]);

    // Verification 2: Verify trigger exists
    const trigCheck = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'trg_squad_progression_sync';
    `);
    console.log('[Verification] trg_squad_progression_sync exists:', trigCheck.rows.length > 0);

    // Verification 3: Verify review_mission_submission function
    const funcCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'review_mission_submission';
    `);
    console.log('[Verification] review_mission_submission RPC exists:', funcCheck.rows.length > 0);

  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

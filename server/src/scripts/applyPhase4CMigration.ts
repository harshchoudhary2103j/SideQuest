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
  const migrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261014000003_squad_review_and_authoritative_xp.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[Migration] Applying Phase 4C squad review and authoritative XP migration...');
    await client.query(migrationSql);
    console.log('[Migration Success] 20261014000003_squad_review_and_authoritative_xp.sql applied successfully.');

    // Verify columns on public.mission_submissions
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'mission_submissions' AND column_name IN ('reviewed_by', 'rejection_reason');
    `);
    console.log('[Verification] Added columns on mission_submissions:');
    for (const c of colRes.rows) {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    }

    // Verify squad_xp_ledger
    const ledgerRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'squad_xp_ledger';
    `);
    console.log(`[Verification] squad_xp_ledger table exists: ${ledgerRes.rows.length > 0}`);

    // Verify review_mission_submission function
    const fnRes = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'review_mission_submission';
    `);
    console.log(`[Verification] review_mission_submission RPC exists: ${fnRes.rows.length > 0}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Migration Error]', msg);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

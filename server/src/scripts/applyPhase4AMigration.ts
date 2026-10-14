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
  const migrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261014000002_daily_mission_engine.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  const seedPath = path.resolve(process.cwd(), '../supabase/seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[Migration] Applying Phase 4A daily mission engine migration...');
    await client.query(migrationSql);
    console.log('[Migration Success] 20261014000002_daily_mission_engine.sql applied successfully.');

    console.log('[Seeding] Seeding 36 canonical mission definitions...');
    await client.query(seedSql);

    const countRes = await client.query('SELECT count(*)::int AS count FROM public.mission_definitions;');
    console.log(`[Seeding Success] Total mission definitions in database: ${countRes.rows[0].count}`);

    const sampleRes = await client.query(`
      SELECT difficulty, count(*)::int AS count
      FROM public.mission_definitions
      GROUP BY difficulty
      ORDER BY difficulty;
    `);
    console.log('[Catalog Breakdown by Difficulty]');
    for (const row of sampleRes.rows) {
      console.log(`  - ${row.difficulty}: ${row.count} missions`);
    }
  } catch (err: any) {
    console.error('[Migration/Seeding Error]', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

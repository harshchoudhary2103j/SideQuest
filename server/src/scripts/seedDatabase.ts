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
  const seedSqlPath = path.resolve(process.cwd(), '../supabase/seed.sql');
  const sql = fs.readFileSync(seedSqlPath, 'utf8');

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[Seeding] Applying canonical mission definitions from supabase/seed.sql...');
    await client.query(sql);

    const countRes = await client.query('SELECT count(*)::int AS count FROM public.mission_definitions;');
    console.log(`[Seeding Success] Total mission definitions in database: ${countRes.rows[0].count}`);

    const listRes = await client.query('SELECT id, title, category, xp_reward FROM public.mission_definitions ORDER BY id;');
    for (const m of listRes.rows) {
      console.log(`  - [${m.category.toUpperCase()}] "${m.title}" (${m.xp_reward} XP)`);
    }
  } catch (err: any) {
    console.error('[Seeding Error]', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

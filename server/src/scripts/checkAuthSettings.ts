import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[Connected to PostgreSQL]');

    // Check auth schema tables
    const authTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth'
      ORDER BY table_name;
    `);
    console.log('[Auth Tables]', authTables.rows.map(r => r.table_name));

    // Check if there are any config tables or users
    const userCount = await client.query('SELECT count(*)::int AS count FROM auth.users;');
    console.log('[Current Auth Users Count]', userCount.rows[0].count);

  } catch (err: any) {
    console.error('[Error]', err.message || err);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[Error] DATABASE_URL not found in server/.env');
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
    console.log('[Connection Status] Successfully connected to remote PostgreSQL database!');

    const versionRes = await client.query('SELECT version();');
    console.log('[PostgreSQL Version]', versionRes.rows[0].version);

    const whoRes = await client.query('SELECT current_database(), current_user;');
    console.log('[Current Database & User]', whoRes.rows[0]);

    // Inspect existing tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('[Existing Public Tables]', tablesRes.rows.map(r => r.table_name));

    // Check existing migrations in supabase_migrations
    const migSchemaRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'supabase_migrations'
      );
    `);
    console.log('[supabase_migrations schema exists?]', migSchemaRes.rows[0].exists);

    if (migSchemaRes.rows[0].exists) {
      const migTableRes = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
        );
      `);
      if (migTableRes.rows[0].exists) {
        const migs = await client.query('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;');
        console.log('[Existing Remote Migrations]', migs.rows.map(r => r.version));
      } else {
        console.log('[Existing Remote Migrations] schema_migrations table does not exist.');
      }
    }

    // Check storage buckets
    const storageRes = await client.query(`
      SELECT id, name, public FROM storage.buckets;
    `);
    console.log('[Existing Storage Buckets]', storageRes.rows);

  } catch (err: any) {
    console.error('[Database Inspection Error]', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

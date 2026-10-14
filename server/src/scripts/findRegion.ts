import pg from 'pg';

const projectRef = 'cmulhyuixtqcvgeplknx';
const password = 'Choudhary@3566';

const regions = [
  'ap-southeast-1', // Singapore
  'ap-south-1',     // Mumbai
  'us-east-1',      // N. Virginia
  'us-west-1',      // N. California
  'us-east-2',      // Ohio
  'eu-central-1',   // Frankfurt
  'eu-west-1',      // Ireland
  'eu-west-2',      // London
  'ap-northeast-1', // Tokyo
  'ap-southeast-2', // Sydney
];

async function checkRegion(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port: 5432,
    user: `postgres.${projectRef}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`[MATCH FOUND!] Region: ${region} (${host}) connected successfully!`);
    const res = await client.query('SELECT version();');
    console.log('[Postgres Version]', res.rows[0].version);
    await client.end();
    return region;
  } catch (err: any) {
    if (err.message && err.message.includes('tenant/user')) {
      // not in this region
    } else {
      console.log(`[${region}]`, err.message);
    }
    await client.end().catch(() => {});
    return null;
  }
}

async function main() {
  console.log(`Detecting pooler region for project ${projectRef}...`);
  for (const region of regions) {
    const match = await checkRegion(region);
    if (match) {
      console.log(`\n>>> Your project region is: ${match} <<<`);
      return;
    }
  }
  console.log('No region matched in standard list.');
}

main();

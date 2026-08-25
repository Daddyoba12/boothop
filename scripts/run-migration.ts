/**
 * Runs the compliance lookup DB migration via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN env var (personal access token from supabase.com/dashboard/account/tokens).
 * Falls back to printing the SQL if no access token is found.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROJECT_REF = 'zwgngbzbdvnrdnanjded';
const SQL_FILE    = path.resolve(__dirname, '../supabase/migrations/20260825_compliance_lookup_db.sql');

async function runViaMgmtApi(sql: string): Promise<boolean> {
  const token = process.env.SUPABASE_ACCESS_TOKEN
    ?? process.env.Boothopsuperbaseautotoken;
  if (!token) return false;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const body = await res.text();
  if (res.ok) {
    console.log('Migration executed successfully via Management API');
    return true;
  }
  console.error('Management API error:', res.status, body);
  return false;
}

async function main() {
  console.log('Reading migration SQL...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`SQL length: ${sql.length} chars`);

  const ok = await runViaMgmtApi(sql);
  if (!ok) {
    console.log('\n─────────────────────────────────────────────────────');
    console.log('No SUPABASE_ACCESS_TOKEN found. To run automatically:');
    console.log('  1. Go to: https://supabase.com/dashboard/account/tokens');
    console.log('  2. Generate a new access token');
    console.log('  3. Add to .env.local: SUPABASE_ACCESS_TOKEN="your_token"');
    console.log('  4. Re-run: npx tsx scripts/run-migration.ts');
    console.log('\nOR manually run the SQL in Supabase SQL editor:');
    console.log('  https://supabase.com/dashboard/project/zwgngbzbdvnrdnanjded/sql/new');
    console.log('  File: supabase/migrations/20260825_compliance_lookup_db.sql');
    console.log('─────────────────────────────────────────────────────');
  }
}

main().catch(console.error);

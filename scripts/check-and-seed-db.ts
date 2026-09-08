/**
 * Check if compliance tables exist in Supabase.
 * If not, create them and then run the scraper.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkTable(name: string): Promise<boolean> {
  const { error } = await supabase.from(name).select('id').limit(1);
  if (error) {
    console.log(`Table '${name}': NOT FOUND (${error.message})`);
    return false;
  }
  console.log(`Table '${name}': EXISTS`);
  return true;
}

async function main() {
  console.log('Checking Supabase compliance tables...\n');
  const rulesExists = await checkTable('compliance_rules');
  const cacheExists = await checkTable('compliance_cache');

  if (!rulesExists || !cacheExists) {
    console.log('\nTables are missing. Please run the SQL migration in Supabase dashboard:');
    console.log('  File: supabase/migrations/20260825_compliance_lookup_db.sql');
    console.log('  Go to: https://supabase.com/dashboard → SQL Editor → paste and run the file\n');
    process.exit(1);
  }

  // Count existing rules
  const { count } = await supabase.from('compliance_rules').select('*', { count: 'exact', head: true });
  console.log(`\nExisting rules in compliance_rules: ${count ?? 0}`);
}

main().catch(console.error);

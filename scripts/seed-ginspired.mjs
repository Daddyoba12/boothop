/**
 * One-time script: set up G-Inspired Commander account
 * - slug: ginspired
 * - password: Admin_k  (is_temp_password = true → forced to change on first login)
 * - email_domain guard: ginspiredautomall.com
 * - migrate otb_pipeline_state company_slug: g-inspired → ginspired
 *
 * Run: node scripts/seed-ginspired.mjs
 */

import { scryptSync, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dir, '..', '.env.local');

// Load .env.local manually
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwgngbzbdvnrdnanjded.supabase.co';
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z25nYnpiZHZucmRuYW5qZGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI5NTA0NSwiZXhwIjoyMDkwODcxMDQ1fQ' +
  '.jP_Ukh4Dwlxfiei5tyHblJ0psgCXntDwnnZBRQch9zw';

const HDR = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function sb(method, table, { body, params } = {}) {
  let url = `${SB_URL}/rest/v1/${table}`;
  if (params) url += '?' + new URLSearchParams(params).toString();
  const res = await fetch(url, { method, headers: HDR, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function run() {
  console.log('── Seeding G-Inspired Commander account ──\n');

  // 1. Find existing row
  const find = await sb('GET', 'pipeline_clients', { params: { slug: 'eq.g-inspired' } });
  console.log('Find g-inspired:', find.status, JSON.stringify(find.data));

  const existing = find.data?.[0];
  const passwordHash = hashPassword('Admin_k');

  if (existing) {
    // 2a. Update existing row
    const update = await sb('PATCH', 'pipeline_clients', {
      params: { id: `eq.${existing.id}` },
      body: {
        slug:             'ginspired',
        password_hash:    passwordHash,
        is_temp_password: true,
        email:            existing.email || 'admin@ginspiredautomall.com',
      },
    });
    console.log('Update pipeline_clients:', update.status, update.ok ? '✓' : JSON.stringify(update.data));
  } else {
    // 2b. Check if ginspired already exists
    const check = await sb('GET', 'pipeline_clients', { params: { slug: 'eq.ginspired' } });
    if (check.data?.[0]) {
      const update = await sb('PATCH', 'pipeline_clients', {
        params: { slug: 'eq.ginspired' },
        body: {
          password_hash:    passwordHash,
          is_temp_password: true,
        },
      });
      console.log('Updated existing ginspired row:', update.status, update.ok ? '✓' : JSON.stringify(update.data));
    } else {
      console.log('⚠  No g-inspired row found and no ginspired row either — please create via Commander UI first');
      process.exit(1);
    }
  }

  // 3. Migrate otb_pipeline_state: company_slug g-inspired → ginspired
  const stateRes = await sb('PATCH', 'otb_pipeline_state', {
    params: { company_slug: 'eq.g-inspired' },
    body:   { company_slug: 'ginspired' },
  });
  console.log('Migrate otb_pipeline_state:', stateRes.status, stateRes.ok ? '✓' : JSON.stringify(stateRes.data));

  // 4. Migrate pipeline_clients.oracle_pipeline if it was 'g-inspired'
  const opRes = await sb('PATCH', 'pipeline_clients', {
    params: { slug: 'eq.ginspired', oracle_pipeline: 'eq.g-inspired' },
    body:   { oracle_pipeline: 'ginspired' },
  });
  console.log('Update oracle_pipeline ref:', opRes.status, opRes.ok ? '✓' : JSON.stringify(opRes.data));

  console.log('\n✅ Done. G-Inspired login: Company ID = ginspired, Password = Admin_k (temp — must change on first login)');
}

run().catch(err => { console.error(err); process.exit(1); });

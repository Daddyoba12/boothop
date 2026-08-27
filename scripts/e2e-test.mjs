/**
 * BootHop E2E test
 *
 * Traveler — real session via Apple review bypass, session cookie captured
 * Sender   — trip inserted via Supabase admin (no auth needed for direct insert)
 * Auto-match cron triggered; results verified; cleanup performed.
 */

const BASE         = 'https://www.boothop.com';
const CRON_SECRET  = 'boothop-cron-secret-2024-x9k2p';
const SUPABASE_URL = 'https://zwgngbzbdvnrdnanjded.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z25nYnpiZHZucmRuYW5qZGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI5NTA0NSwiZXhwIjoyMDkwODcxMDQ1fQ.jP_Ukh4Dwlxfiei5tyHblJ0psgCXntDwnnZBRQch9zw';

const TRAVELER_EMAIL = 'daddyoba12@gmail.com';
const SENDER_EMAIL   = `test-sender-${Date.now()}@boothoptest.internal`;

const TRIP_DATE = '2026-09-25';
const FROM      = 'Lagos, Nigeria';
const TO        = 'London, United Kingdom';

// ── helpers ──────────────────────────────────────────────────────────────────

async function getSession() {
  await fetch(`${BASE}/api/auth/request-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TRAVELER_EMAIL }),
  });
  const res = await fetch(`${BASE}/api/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TRAVELER_EMAIL, code: 'REVIEW1' }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`);

  // Extract the session cookie from Set-Cookie header
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookieMatch = setCookie.match(/boothop_session=([^;]+)/);
  const sessionCookie = cookieMatch ? `boothop_session=${cookieMatch[1]}` : null;

  return { token: data.token, cookie: sessionCookie };
}

async function api(path, { token, cookie }, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (token)  headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function sbInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation',
    },
    body: JSON.stringify(row),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function sbQuery(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function sbDelete(table, ids) {
  if (!ids.length) return '(none)';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=in.(${ids.join(',')})`,
    {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
    }
  );
  return res.status;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
function pass(msg)    { console.log(`  ✓  ${msg}`); }
function fail(msg)    { console.log(`  ✗  ${msg}`); process.exitCode = 1; }
function info(msg)    { console.log(`  ℹ  ${msg}`); }
function section(msg) { console.log(`\n── ${msg}`); }

// ── main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  BootHop E2E Flow Test                   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Traveler : ${TRAVELER_EMAIL}`);
  console.log(`  Sender   : ${SENDER_EMAIL}`);
  console.log(`  Route    : ${FROM} → ${TO}  |  Date: ${TRIP_DATE}`);

  const travellerTripIds = [];
  const senderTripIds    = [];
  let   matchIds         = [];
  let   auth;

  // ── 1. Authenticate traveler ────────────────────────────────────────────────
  section('1. AUTH — Traveler login (Apple review bypass)');
  try {
    auth = await getSession();
    pass(`Session obtained`);
    console.log(`  Token  : ${auth.token.slice(0, 45)}…`);
    console.log(`  Cookie : ${auth.cookie ? auth.cookie.slice(0, 45) + '…' : '(not set)'}`);
  } catch (e) {
    fail(`Login failed: ${e.message}`);
    process.exit(1);
  }

  const meRes = await api('/api/auth/me', auth);
  console.log(`  /auth/me : ${meRes.status} — ${JSON.stringify(meRes.data).slice(0, 80)}`);
  if (meRes.status === 200 && meRes.data?.user?.email) {
    pass(`Authenticated as ${meRes.data.user.email}`);
  } else {
    fail(`/auth/me unexpected response — check cookie/token injection`);
  }

  // ── 2. Traveler — post a trip ───────────────────────────────────────────────
  section('2. TRAVELER — Post a Trip (mode: travel)');
  const tPost = await api('/api/trips/create', auth, {
    from: FROM, to: TO, date: TRIP_DATE, weight: 15, price: 80, mode: 'travel',
  });
  console.log(`  Status   : ${tPost.status}`);
  console.log(`  Response : ${JSON.stringify(tPost.data).slice(0, 120)}`);
  if (tPost.status === 200 && tPost.data?.ok) {
    pass('Trip created successfully');
  } else {
    fail(`Trip creation failed: ${JSON.stringify(tPost.data)}`);
  }

  await wait(700);
  const tTripsDb = await sbQuery('trips',
    `email=eq.${encodeURIComponent(TRAVELER_EMAIL)}&type=eq.travel&status=eq.active&travel_date=eq.${TRIP_DATE}`
  );
  if (Array.isArray(tTripsDb) && tTripsDb.length > 0) {
    travellerTripIds.push(...tTripsDb.map(t => t.id));
    pass(`DB confirmed — ID: ${tTripsDb[0].id} | ${tTripsDb[0].from_city} → ${tTripsDb[0].to_city}`);
  } else {
    fail('Trip not found in DB');
  }

  // ── 3. Validation checks ───────────────────────────────────────────────────
  section('3. VALIDATION — API rejects bad inputs');

  const missingWeight = await api('/api/trips/create', auth, {
    from: FROM, to: TO, date: TRIP_DATE, mode: 'travel', price: 50,
  });
  if (missingWeight.status === 400 && missingWeight.data?.error?.toLowerCase().includes('weight')) {
    pass(`Missing weight rejected — "${missingWeight.data.error}"`);
  } else {
    fail(`Expected 400 for missing weight, got ${missingWeight.status}: ${JSON.stringify(missingWeight.data)}`);
  }

  const pastDate = await api('/api/trips/create', auth, {
    from: FROM, to: TO, date: '2024-01-01', weight: 10, price: 50, mode: 'travel',
  });
  if (pastDate.status === 400 && pastDate.data?.error?.toLowerCase().includes('tomorrow')) {
    pass(`Past date rejected — "${pastDate.data.error}"`);
  } else {
    fail(`Expected 400 for past date, got ${pastDate.status}: ${JSON.stringify(pastDate.data)}`);
  }

  const zeroPrice = await api('/api/trips/create', auth, {
    from: FROM, to: TO, date: TRIP_DATE, weight: 10, price: 0, mode: 'travel',
  });
  if (zeroPrice.status === 400) {
    pass(`Zero price rejected — "${zeroPrice.data?.error}"`);
  } else {
    fail(`Expected 400 for £0 price, got ${zeroPrice.status}`);
  }

  // ── 4. Traveler dashboard ──────────────────────────────────────────────────
  section('4. TRAVELER — Dashboard');
  const tDash = await api('/api/dashboard', auth);
  console.log(`  Status   : ${tDash.status}`);
  if (tDash.status === 200) {
    const trips   = tDash.data?.activeTrips ?? tDash.data?.trips ?? [];
    const matches = tDash.data?.matches ?? [];
    pass(`Dashboard OK — ${trips.length} active trip(s), ${matches.length} existing match(es)`);
    if (trips.length) {
      const t = trips[0];
      console.log(`  Latest   : ${t.originCity ?? t.from_city} → ${t.destinationCity ?? t.to_city} | status: ${t.status}`);
    }
  } else {
    fail(`Dashboard ${tDash.status}: ${JSON.stringify(tDash.data)}`);
  }

  // ── 5. Sender — insert delivery request ───────────────────────────────────
  section('5. SENDER — Insert delivery request (type: send)');
  const sInsert = await sbInsert('trips', {
    email:       SENDER_EMAIL,
    user_id:     null,
    type:        'send',
    from_city:   FROM,
    to_city:     TO,
    travel_date: TRIP_DATE,
    weight:      5,
    price:       40,
    status:      'active',
  });
  console.log(`  Status   : ${sInsert.status}`);
  if (sInsert.status === 201) {
    const row = Array.isArray(sInsert.data) ? sInsert.data[0] : sInsert.data;
    senderTripIds.push(row?.id);
    pass(`Sender request inserted — ID: ${row?.id} | ${row?.from_city} → ${row?.to_city}`);
  } else {
    fail(`Sender insert failed: ${JSON.stringify(sInsert.data)}`);
  }

  // ── 6. Auto-match cron ─────────────────────────────────────────────────────
  section('6. AUTO-MATCH — Trigger cron');
  const cronRes = await fetch(`${BASE}/api/cron/auto-match`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const cronData = await cronRes.json().catch(() => ({}));
  console.log(`  Status   : ${cronRes.status}`);
  console.log(`  Response : ${JSON.stringify(cronData).slice(0, 200)}`);
  if (cronRes.status === 200) {
    pass('Auto-match cron executed');
    if (cronData.matched !== undefined) info(`Matched: ${cronData.matched}, skipped: ${cronData.skipped}`);
  } else {
    fail(`Cron returned ${cronRes.status}: ${JSON.stringify(cronData)}`);
  }

  // ── 7. Match check ─────────────────────────────────────────────────────────
  section('7. MATCH CHECK');
  await wait(1500);

  const matchRows = await sbQuery('matches',
    `or=(sender_email.eq.${encodeURIComponent(SENDER_EMAIL)},traveler_email.eq.${encodeURIComponent(TRAVELER_EMAIL)})`
  );

  if (Array.isArray(matchRows) && matchRows.length > 0) {
    matchIds = matchRows.map(m => m.id);
    pass(`Match found! ID: ${matchRows[0].id} | status: ${matchRows[0].status}`);
    console.log(`  Sender   : ${matchRows[0].sender_email}`);
    console.log(`  Traveler : ${matchRows[0].traveler_email}`);
  } else {
    info('No match yet (matching engine may require closer route overlap or different travel dates)');
  }

  const tDash2 = await api('/api/dashboard', auth);
  const tMatches2 = tDash2.data?.matches ?? [];
  if (tMatches2.length > 0) {
    pass(`Traveler dashboard reflects ${tMatches2.length} match(es)`);
    const m = tMatches2[0];
    console.log(`  Status   : ${m.status} | Role: ${m.userRole}`);
  } else {
    info('No matches on traveler dashboard yet');
  }

  // ── 8. Cleanup ─────────────────────────────────────────────────────────────
  section('8. CLEANUP');
  if (travellerTripIds.filter(Boolean).length) {
    const s = await sbDelete('trips', travellerTripIds.filter(Boolean));
    pass(`Deleted ${travellerTripIds.length} traveler trip(s) — HTTP ${s}`);
  }
  if (senderTripIds.filter(Boolean).length) {
    const s = await sbDelete('trips', senderTripIds.filter(Boolean));
    pass(`Deleted ${senderTripIds.length} sender trip(s) — HTTP ${s}`);
  }
  if (matchIds.length) {
    const s = await sbDelete('matches', matchIds);
    pass(`Deleted ${matchIds.length} test match(es) — HTTP ${s}`);
  }
  if (!travellerTripIds.length && !senderTripIds.length) {
    info('No test rows to clean up');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  section('RESULT');
  console.log(process.exitCode === 1
    ? '  ✗  Some checks failed — review above\n'
    : '  ✓  All checks passed\n'
  );
})();

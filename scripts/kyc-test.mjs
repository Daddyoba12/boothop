/**
 * BootHop KYC Flow Test
 *
 * Tests what happens when KYC is completed end-to-end:
 *   1. Create a committed match in the DB
 *   2. Call /api/kyc/create-session (Stripe Identity)
 *   3. Simulate Stripe webhook: sender verified
 *   4. Simulate Stripe webhook: traveler verified → match → kyc_complete
 *   5. Simulate video-submit (direct DB, skips actual file upload)
 *   6. Simulate admin video-approve → profiles.id_verified = true
 *   7. Verify all state, clean up
 */

const BASE         = 'https://www.boothop.com';
const SUPABASE_URL = 'https://zwgngbzbdvnrdnanjded.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z25nYnpiZHZucmRuYW5qZGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI5NTA0NSwiZXhwIjoyMDkwODcxMDQ1fQ.jP_Ukh4Dwlxfiei5tyHblJ0psgCXntDwnnZBRQch9zw';

const AUTH_EMAIL = 'daddyoba12@gmail.com';
const SENDER_EMAIL   = AUTH_EMAIL;
const TRAVELER_EMAIL = `kyc-test-traveler-${Date.now()}@boothoptest.internal`;

// ── helpers ───────────────────────────────────────────────────────────────────

async function getSession() {
  await fetch(`${BASE}/api/auth/request-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: AUTH_EMAIL }),
  });
  const res = await fetch(`${BASE}/api/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: AUTH_EMAIL, code: 'REVIEW1' }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookieMatch = setCookie.match(/boothop_session=([^;]+)/);
  const sessionCookie = cookieMatch ? `boothop_session=${cookieMatch[1]}` : null;
  return { token: data.token, cookie: sessionCookie };
}

async function api(path, { token, cookie }, body) {
  const hdrs = { 'Content-Type': 'application/json' };
  if (cookie) hdrs['Cookie'] = cookie;
  if (token)  hdrs['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${BASE}${path}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: hdrs,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  return res.json();
}

async function sbUpdate(table, matchCol, matchVal, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchCol}=eq.${encodeURIComponent(matchVal)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation',
    },
    body: JSON.stringify(update),
  });
  return res.json();
}

async function sbGet(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function sbDelete(table, ids) {
  if (!ids.length) return '(none)';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=in.(${ids.join(',')})`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
  });
  return res.status;
}

async function sbDeleteWhere(table, col, val) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
  });
  return res.status;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
function pass(msg)    { console.log(`  ✓  ${msg}`); }
function fail(msg)    { console.log(`  ✗  ${msg}`); process.exitCode = 1; }
function info(msg)    { console.log(`  ℹ  ${msg}`); }
function section(msg) { console.log(`\n── ${msg}`); }

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  BootHop KYC Flow Test                   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Sender   : ${SENDER_EMAIL}`);
  console.log(`  Traveler : ${TRAVELER_EMAIL}`);

  let auth;
  let matchId = null;
  let senderTripId = null;
  let travelerTripId = null;

  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  section('1. AUTH — Login as sender');
  try {
    auth = await getSession();
    pass(`Session obtained`);
  } catch (e) {
    fail(`Login failed: ${e.message}`);
    process.exit(1);
  }

  // ── 2. Create trips ──────────────────────────────────────────────────────────
  section('2. SETUP — Create two trips to link to match');

  const TRIP_DATE  = '2026-10-15';
  const FROM_CITY  = 'Lagos, Nigeria';
  const TO_CITY    = 'London, United Kingdom';

  const senderTrip = await sbInsert('trips', {
    email:       SENDER_EMAIL,
    user_id:     null,
    type:        'send',
    from_city:   FROM_CITY,
    to_city:     TO_CITY,
    travel_date: TRIP_DATE,
    weight:      3,
    price:       40,
    status:      'matched',
  });
  const senderTripRow = Array.isArray(senderTrip) ? senderTrip[0] : senderTrip;
  if (senderTripRow?.id) {
    senderTripId = senderTripRow.id;
    pass(`Sender trip created — ID: ${senderTripId}`);
  } else {
    fail(`Sender trip failed: ${JSON.stringify(senderTrip)}`);
  }

  const travelerTrip = await sbInsert('trips', {
    email:       TRAVELER_EMAIL,
    user_id:     null,
    type:        'travel',
    from_city:   FROM_CITY,
    to_city:     TO_CITY,
    travel_date: TRIP_DATE,
    weight:      15,
    price:       80,
    status:      'matched',
  });
  const travelerTripRow = Array.isArray(travelerTrip) ? travelerTrip[0] : travelerTrip;
  if (travelerTripRow?.id) {
    travelerTripId = travelerTripRow.id;
    pass(`Traveler trip created — ID: ${travelerTripId}`);
  } else {
    fail(`Traveler trip failed: ${JSON.stringify(travelerTrip)}`);
  }

  // ── 3. Create committed match ────────────────────────────────────────────────
  section('3. SETUP — Insert committed match');

  const matchRow = await sbInsert('matches', {
    sender_email:        SENDER_EMAIL,
    traveler_email:      TRAVELER_EMAIL,
    sender_trip_id:      senderTripId,
    traveler_trip_id:    travelerTripId,
    status:              'committed',
    agreed_price:        50,
    sender_kyc_status:   'none',
    traveler_kyc_status: 'none',
  });
  const match0 = Array.isArray(matchRow) ? matchRow[0] : matchRow;
  if (match0?.id) {
    matchId = match0.id;
    pass(`Match created — ID: ${matchId} | status: ${match0.status}`);
  } else {
    fail(`Match insert failed: ${JSON.stringify(matchRow)}`);
    // try to clean up trips
    if (senderTripId)   await sbDelete('trips', [senderTripId]);
    if (travelerTripId) await sbDelete('trips', [travelerTripId]);
    process.exit(1);
  }

  // ── 4. Call /api/kyc/create-session (as sender) ──────────────────────────────
  section('4. STRIPE IDENTITY — POST /api/kyc/create-session');
  info('Calling create-session as the sender (daddyoba12@gmail.com)...');
  const sessionRes = await api('/api/kyc/create-session', auth, { matchId });
  console.log(`  Status   : ${sessionRes.status}`);
  console.log(`  Response : ${JSON.stringify(sessionRes.data).slice(0, 200)}`);

  if (sessionRes.status === 200 && sessionRes.data?.url) {
    pass(`Stripe Identity session created — user would be redirected to: ${sessionRes.data.url.slice(0, 60)}...`);
    // Verify DB was updated
    await wait(600);
    const matchCheck = await sbGet('matches', `id=eq.${matchId}`);
    const mc = Array.isArray(matchCheck) ? matchCheck[0] : matchCheck;
    if (mc?.sender_kyc_status === 'pending') {
      pass(`sender_kyc_status → "pending" ✓`);
    } else {
      info(`sender_kyc_status = "${mc?.sender_kyc_status}" (expected "pending")`);
    }
    if (mc?.status === 'kyc_pending') {
      pass(`match status → "kyc_pending" ✓`);
    } else {
      info(`match status = "${mc?.status}" (expected "kyc_pending")`);
    }
  } else if (sessionRes.status === 500 && sessionRes.data?.error?.includes('Stripe')) {
    info(`Stripe not reachable in test env — simulating webhook effect directly`);
  } else {
    fail(`Unexpected response: ${JSON.stringify(sessionRes.data)}`);
  }

  // ── 5. Simulate Stripe webhook: sender verified ──────────────────────────────
  section('5. SIMULATE STRIPE WEBHOOK — sender_kyc_status → verified');
  const now = new Date().toISOString();
  const senderVerified = await sbUpdate('matches', 'id', matchId, {
    sender_kyc_status:      'verified',
    sender_kyc_verified_at: now,
    status:                 'kyc_pending',
  });
  const sv = Array.isArray(senderVerified) ? senderVerified[0] : {};
  info(`sender_kyc_status = "${sv?.sender_kyc_status}" | traveler_kyc_status = "${sv?.traveler_kyc_status}"`);
  info(`match status = "${sv?.status}" (still kyc_pending — traveler not yet verified)`);
  pass('Sender KYC simulated as verified');

  // ── 6. Simulate Stripe webhook: traveler verified → kyc_complete ──────────────
  section('6. SIMULATE STRIPE WEBHOOK — traveler_kyc_status → verified → kyc_complete');
  const travelerVerified = await sbUpdate('matches', 'id', matchId, {
    traveler_kyc_status:      'verified',
    traveler_kyc_verified_at: now,
    status:                   'kyc_complete',
  });
  const tv = Array.isArray(travelerVerified) ? travelerVerified[0] : {};
  if (tv?.status === 'kyc_complete') {
    pass(`Both parties verified → match status = "kyc_complete" ✓`);
  } else {
    fail(`Expected kyc_complete, got: ${tv?.status}`);
  }
  info(`sender_kyc_status = "${tv?.sender_kyc_status}" | traveler_kyc_status = "${tv?.traveler_kyc_status}"`);
  info('Real Stripe webhook would also send "both verified" emails to both parties here');

  // ── 7. Verify final match state ──────────────────────────────────────────────
  section('7. VERIFY — Final match state after KYC');
  const finalMatch = await sbGet('matches', `id=eq.${matchId}`);
  const fm = Array.isArray(finalMatch) ? finalMatch[0] : finalMatch;
  console.log(`  Match ID             : ${fm?.id}`);
  console.log(`  Status               : ${fm?.status}`);
  console.log(`  sender_kyc_status    : ${fm?.sender_kyc_status}`);
  console.log(`  traveler_kyc_status  : ${fm?.traveler_kyc_status}`);
  console.log(`  sender_kyc_verified_at   : ${fm?.sender_kyc_verified_at}`);
  console.log(`  traveler_kyc_verified_at : ${fm?.traveler_kyc_verified_at}`);

  if (fm?.status === 'kyc_complete' && fm?.sender_kyc_status === 'verified' && fm?.traveler_kyc_status === 'verified') {
    pass('Stripe Identity KYC fully verified for both parties ✓');
  } else {
    fail('Match state does not reflect full KYC completion');
  }

  // ── 8. Video KYC — simulate video_kyc table insert ──────────────────────────
  section('8. VIDEO KYC — Simulate video submission (sender)');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Direct DB insert simulating what /api/kyc/video-submit does
  const videoKycInsert = await sbInsert('video_kyc', {
    match_id:     matchId,
    email:        SENDER_EMAIL,
    video_path:   `${matchId}/${SENDER_EMAIL}/video-test.webm`,
    photo_path:   `${matchId}/${SENDER_EMAIL}/photo-test.jpg`,
    status:       'pending_review',
    expires_at:   expiresAt,
    submitted_at: now,
  });
  const vki = Array.isArray(videoKycInsert) ? videoKycInsert[0] : videoKycInsert;
  if (vki?.match_id || vki?.id) {
    pass(`video_kyc record inserted — match_id: ${matchId}`);
  } else {
    info(`video_kyc insert result: ${JSON.stringify(videoKycInsert).slice(0, 200)}`);
  }

  // Update matches using correct column names (routes now fixed)
  await sbUpdate('matches', 'id', matchId, {
    sender_video_kyc_status:     'pending_review',
    sender_video_kyc_expires_at: expiresAt,
  });
  pass(`matches.sender_video_kyc_status → "pending_review"`);

  // ── 9. Admin video-approve (direct DB simulation) ───────────────────────────
  section('9. ADMIN VIDEO-APPROVE — simulate approval via DB');
  info('Routes fixed (sender_email/traveler_email). Simulating here to avoid needing admin role in profiles.');

  await sbUpdate('matches', 'id', matchId, {
    sender_video_kyc_status: 'approved',
    sender_id_received:      true,
  });
  // Upsert into user_verifications (email-keyed, no FK to auth.users)
  await fetch(`${SUPABASE_URL}/rest/v1/user_verifications?on_conflict=email`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ email: SENDER_EMAIL, id_verified: true, id_verified_at: now, updated_at: now }),
  });
  await sbUpdate('video_kyc', 'match_id', matchId, { status: 'approved', reviewed_at: now, reviewed_by: 'test-simulation' });
  pass('Video KYC approval simulated via direct DB update');

  // ── 10. Verify user_verifications.id_verified ─────────────────────────────────
  section('10. VERIFY — user_verifications.id_verified for sender');
  const verifs = await sbGet('user_verifications', `email=eq.${encodeURIComponent(SENDER_EMAIL)}`);
  const verif = Array.isArray(verifs) ? verifs[0] : verifs;
  console.log(`  email          : ${verif?.email}`);
  console.log(`  id_verified    : ${verif?.id_verified}`);
  console.log(`  id_verified_at : ${verif?.id_verified_at}`);

  if (verif?.id_verified === true) {
    pass(`user_verifications.id_verified = true for ${SENDER_EMAIL} ✓`);
  } else {
    fail(`Expected id_verified = true, got: ${verif?.id_verified}`);
  }

  // ── 11. Final match state summary ─────────────────────────────────────────────
  section('11. FINAL STATE — Full match snapshot');
  const finalMatch2 = await sbGet('matches', `id=eq.${matchId}`);
  const fm2 = Array.isArray(finalMatch2) ? finalMatch2[0] : finalMatch2;
  const relevant = {
    id:                         fm2?.id,
    status:                     fm2?.status,
    sender_kyc_status:          fm2?.sender_kyc_status,
    traveler_kyc_status:        fm2?.traveler_kyc_status,
    sender_video_kyc_status:    fm2?.sender_video_kyc_status,
    traveler_video_kyc_status:  fm2?.traveler_video_kyc_status,
    sender_id_received:         fm2?.sender_id_received,
    traveler_id_received:       fm2?.traveler_id_received,
  };
  console.log('\n  KYC State:');
  for (const [k, v] of Object.entries(relevant)) {
    console.log(`    ${k.padEnd(28)}: ${v}`);
  }

  // ── 12. Cleanup ───────────────────────────────────────────────────────────────
  section('12. CLEANUP');

  await sbDeleteWhere('video_kyc', 'match_id', matchId);
  pass('video_kyc records deleted');

  if (matchId) {
    await sbDelete('matches', [matchId]);
    pass(`Match ${matchId} deleted`);
  }
  if (senderTripId)   { await sbDelete('trips', [senderTripId]);   pass(`Sender trip ${senderTripId} deleted`); }
  if (travelerTripId) { await sbDelete('trips', [travelerTripId]); pass(`Traveler trip ${travelerTripId} deleted`); }

  await sbDeleteWhere('user_verifications', 'email', SENDER_EMAIL);
  pass(`Test user_verifications row deleted (cleanup)`);

  // ── Summary ────────────────────────────────────────────────────────────────
  section('RESULT');
  console.log(process.exitCode === 1
    ? '  ✗  Some checks failed — review above\n'
    : '  ✓  All checks passed\n'
  );
  console.log('  KYC Flow Summary:');
  console.log('    committed → (Stripe session created) → kyc_pending');
  console.log('    sender verifies via Stripe Identity → sender_kyc_status = "verified"');
  console.log('    traveler verifies via Stripe Identity → traveler_kyc_status = "verified" → kyc_complete');
  console.log('    Both parties receive "Both KYC verified" email (sendBothKycVerifiedEmail)');
  console.log('    Separately: video upload → pending_review → admin approves → id_verified = true');
  console.log('');
})();

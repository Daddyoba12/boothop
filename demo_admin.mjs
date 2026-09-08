/**
 * BootHop superadmin demo recording
 * Visits /commander/superdemo → auto-logs in as boothop superadmin → walks through admin tour
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3001';
const OUT  = 'C:/Users/babso/Desktop/commander_demo';
mkdirSync(OUT, { recursive: true });

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, name, label) {
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[✓] ${label} → ${file}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized'],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });

  const page = await ctx.newPage();
  console.log('\n══════════════════════════════════════════');
  console.log('  BootHop SUPERADMIN DEMO — starting…');
  console.log('══════════════════════════════════════════\n');

  // ── Step 1: Auto-login via /commander/superdemo ────────────────────────────
  console.log('→ Step 1: Auto-login as boothop superadmin…');
  await page.goto(`${BASE}/commander/superdemo`);
  await page.waitForURL('**/commander/pipeline/boothop**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await wait(2500);
  await shot(page, 'admin_01_pipeline_loaded', '01 — Superadmin: Pipeline loaded (boothop)');

  // ── Step 2: Tour overlay — superadmin intro ───────────────────────────────
  console.log('→ Step 2: Admin tour overlay…');
  await wait(800);
  await shot(page, 'admin_02_tour_welcome', '02 — Admin Tour: Welcome');

  // ── Step 3: All Clients tab ────────────────────────────────────────────────
  console.log('→ Step 3: All Clients tab…');
  await page.locator('.tour-btn-next').first().click(); // step 2 — All Clients
  await wait(2000); // tour switches to clients tab
  await shot(page, 'admin_03_all_clients', '03 — Admin Tour: All Clients tab');

  // ── Step 4: Click View Pipeline for ginspired ─────────────────────────────
  console.log('→ Step 4: View ginspired pipeline…');
  const ginspiredLink = page.locator('a[href*="/commander/pipeline/ginspired"]').first();
  if (await ginspiredLink.count() > 0) {
    await ginspiredLink.click();
    await page.waitForURL('**/commander/pipeline/ginspired**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await wait(2500);
    await shot(page, 'admin_04_ginspired_pipeline', '04 — Admin viewing G-Inspired pipeline');
  }

  // ── Step 5: Pipeline slots (ginspired data) ────────────────────────────────
  console.log('→ Step 5: G-Inspired slot cards…');
  const pipelineBtn = page.locator('.tab-btn', { hasText: 'Pipeline' });
  if (await pipelineBtn.count() > 0) {
    await pipelineBtn.click();
    await wait(2000);
    await shot(page, 'admin_05_ginspired_slots', '05 — G-Inspired: 4 slot cards');
  }

  // ── Step 6: Edit a slot on behalf of ginspired ────────────────────────────
  console.log('→ Step 6: Edit slot on behalf of ginspired…');
  const editBtn = page.locator('.slot-actions .btn-secondary[title="Edit text"]').first();
  if (await editBtn.count() > 0) {
    await editBtn.click();
    await wait(800);
    await shot(page, 'admin_06_edit_panel', '06 — Admin editing G-Inspired slot');
    const closeBtn = page.locator('.edit-ph .btn-secondary').first();
    if (await closeBtn.count() > 0) { await closeBtn.click(); await wait(300); }
  }

  // ── Step 7: Revoice Studio for ginspired ─────────────────────────────────
  console.log('→ Step 7: Revoice Studio for ginspired…');
  const revoiceSlotBtn = page.locator('.slot-actions .btn-secondary[title="Revoice Studio"]').first();
  if (await revoiceSlotBtn.count() > 0) {
    await revoiceSlotBtn.click();
    await wait(2000);
    await shot(page, 'admin_07_revoice_ginspired', '07 — Admin: Revoice for G-Inspired slot');
  }

  // ── Step 8: Back to boothop pipeline ─────────────────────────────────────
  console.log('→ Step 8: Switch back to boothop pipeline…');
  await page.goto(`${BASE}/commander/pipeline/boothop`);
  await page.waitForLoadState('networkidle');
  await wait(2500);
  await shot(page, 'admin_08_boothop_pipeline', '08 — Back to BootHop pipeline');

  // ── Step 9: All Clients tab ────────────────────────────────────────────────
  console.log('→ Step 9: All Clients view…');
  const clientsTab = page.locator('.tab-btn', { hasText: 'All Clients' });
  if (await clientsTab.count() > 0) {
    await clientsTab.click();
    await wait(1800);
    await shot(page, 'admin_09_all_clients_list', '09 — All Clients: 3 accounts');
  }

  // ── Step 10: Onboard new client ───────────────────────────────────────────
  console.log('→ Step 10: Onboard tab…');
  const onboardBtn = page.locator('.tab-btn', { hasText: 'Onboard' });
  await onboardBtn.click();
  await wait(1800);
  await shot(page, 'admin_10_onboard', '10 — Onboard: New client profile setup');

  // ── Step 11: Tour finish steps ────────────────────────────────────────────
  console.log('→ Step 11: Complete admin tour…');
  const nextBtns = page.locator('.tour-btn-next');
  for (let i = 0; i < 4; i++) {
    if (await nextBtns.count() > 0) {
      await nextBtns.first().click();
      await wait(1200);
    }
  }
  await shot(page, 'admin_11_tour_done', '11 — Admin tour complete');

  // ── Step 12: Final overview ────────────────────────────────────────────────
  console.log('→ Step 12: Final pipeline overview…');
  const pipelineTabFinal = page.locator('.tab-btn', { hasText: 'Pipeline' });
  if (await pipelineTabFinal.count() > 0) {
    await pipelineTabFinal.click();
    await wait(1500);
    await shot(page, 'admin_12_final', '12 — Final: BootHop pipeline overview');
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  ADMIN DEMO COMPLETE');
  console.log(`  Screenshots + video → ${OUT}`);
  console.log('══════════════════════════════════════════\n');

  await wait(3000);
  await ctx.close();
  await browser.close();
})();

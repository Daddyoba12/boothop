/**
 * G-Inspired (regular client) demo recording
 * Visits /commander/demo → auto-logs in as ginspired → walks through tour steps
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
  console.log('  G-Inspired CLIENT DEMO — starting…');
  console.log('══════════════════════════════════════════\n');

  // ── Step 1: Auto-login via /commander/demo ─────────────────────────────────
  console.log('→ Step 1: Auto-login as ginspired client…');
  await page.goto(`${BASE}/commander/demo`);
  await page.waitForURL('**/commander/pipeline/ginspired**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await wait(2500);
  await shot(page, 'client_01_pipeline_loaded', '01 — Pipeline loaded (ginspired)');

  // ── Step 2: Tour overlay visible ──────────────────────────────────────────
  console.log('→ Step 2: Tour overlay…');
  await wait(1000);
  await shot(page, 'client_02_tour_welcome', '02 — Tour: Welcome');

  // ── Step 3: Next → Slot cards ─────────────────────────────────────────────
  console.log('→ Step 3: Tour step 2 — slot cards…');
  await page.locator('.tour-btn-next').first().click();
  await wait(1500);
  await shot(page, 'client_03_tour_slots', '03 — Tour: Pipeline Slots');

  // ── Step 4: Next → Approve ────────────────────────────────────────────────
  console.log('→ Step 4: Tour step 3 — approve…');
  await page.locator('.tour-btn-next').first().click();
  await wait(1200);
  await shot(page, 'client_04_tour_approve', '04 — Tour: Approve & Post');

  // ── Step 5: Click Edit on Slot 1 to show edit panel ──────────────────────
  console.log('→ Step 5: Open edit panel…');
  const editBtn = page.locator('.slot-actions .btn-secondary[title="Edit text"]').first();
  if (await editBtn.count() > 0) {
    await editBtn.click();
    await wait(800);
    await shot(page, 'client_05_edit_panel', '05 — Edit panel open');
    const hookTA = page.locator('.ef textarea').first();
    if (await hookTA.count() > 0) {
      await hookTA.click({ clickCount: 3 });
      await hookTA.type('She drove 40 minutes to the dealership. The car was already gone. G-Inspired Automall — browse live stock before you drive.');
      await wait(400);
      await shot(page, 'client_06_hook_edited', '06 — Hook text amended');
    }
    const closeBtn = page.locator('.edit-ph .btn-secondary').first();
    if (await closeBtn.count() > 0) { await closeBtn.click(); await wait(400); }
  }

  // ── Step 6: Tour next → Revoice (step 5) ─────────────────────────────────
  console.log('→ Step 6: Tour step 4 → Edit, 5 → Revoice…');
  await page.locator('.tour-btn-next').first().click(); // step 4 edit
  await wait(800);
  await page.locator('.tour-btn-next').first().click(); // step 5 revoice
  await wait(1800); // switches to revoice tab
  await shot(page, 'client_07_revoice_tab', '07 — Revoice Studio tab');

  // ── Step 7: Load Slot 1 into Revoice ─────────────────────────────────────
  console.log('→ Step 7: Load slot 1 into Revoice…');
  const pipelineTab = page.locator('.tab-btn', { hasText: 'Pipeline' });
  await pipelineTab.click();
  await wait(1200);
  const revoiceSlotBtn = page.locator('.slot-actions .btn-secondary[title="Revoice Studio"]').first();
  if (await revoiceSlotBtn.count() > 0) {
    await revoiceSlotBtn.click();
    await wait(2000);
    await shot(page, 'client_08_revoice_loaded', '08 — Revoice: Slot 1 video + script loaded');
  }

  // ── Step 8: Script edit ───────────────────────────────────────────────────
  console.log('→ Step 8: Edit script…');
  const scriptTA = page.locator('.rv-textarea');
  if (await scriptTA.count() > 0) {
    await scriptTA.click({ clickCount: 3 });
    await scriptTA.fill('She drove 40 minutes. The car was gone. G-Inspired Automall — browse live stock online. Reserve before you drive. Visit ginspiredautomall.com today.');
    await wait(600);
    await shot(page, 'client_09_script_edited', '09 — Script edited');
  }

  // ── Step 9: Tour next steps ───────────────────────────────────────────────
  console.log('→ Step 9: Tour next steps…');
  const nextBtns = page.locator('.tour-btn-next');
  for (let i = 0; i < 3; i++) {
    if (await nextBtns.count() > 0) {
      await nextBtns.first().click();
      await wait(1400);
      await shot(page, `client_10_tour_step${i + 7}`, `10.${i} — Tour step ${i + 7}`);
    }
  }

  // ── Step 10: Music selector ───────────────────────────────────────────────
  console.log('→ Step 10: Music selector…');
  const revoiceTabBtn = page.locator('.tab-btn', { hasText: 'Revoice Studio' });
  if (await revoiceTabBtn.count() > 0) {
    await revoiceTabBtn.click();
    await wait(1000);
  }
  const musicSel = page.locator('.music-sel');
  if (await musicSel.count() > 0) {
    const opts = await musicSel.locator('option').count();
    if (opts > 1) {
      await musicSel.selectOption({ index: 1 });
      await wait(600);
      await shot(page, 'client_11_music', `11 — Music selected (${opts} tracks)`);
    }
  }

  // ── Step 11: Bake section ─────────────────────────────────────────────────
  console.log('→ Step 11: Bake section…');
  await shot(page, 'client_12_bake_ready', '12 — Bake Video section');

  // ── Step 12: Onboard tab ─────────────────────────────────────────────────
  console.log('→ Step 12: Onboard tab…');
  const onboardBtn = page.locator('.tab-btn', { hasText: 'Onboard' });
  await onboardBtn.click();
  await wait(1800);
  await shot(page, 'client_13_onboard', '13 — Onboard: Business Profile');

  console.log('\n══════════════════════════════════════════');
  console.log('  CLIENT DEMO COMPLETE');
  console.log(`  Screenshots + video → ${OUT}`);
  console.log('══════════════════════════════════════════\n');

  await wait(3000);
  await ctx.close();
  await browser.close();
})();

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3001';
const OUT  = 'C:/Users/babso/Desktop/commander_demo';
mkdirSync(OUT, { recursive: true });

async function shot(page, name, label) {
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[✓] ${label} → ${file}`);
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  // ── 1. LOGIN PAGE ──────────────────────────────────────────────────────────
  console.log('\n── Step 1: Login Page ──');
  await page.goto(`${BASE}/commander`);
  await page.waitForLoadState('networkidle');
  await shot(page, '01_login_page', 'Login page');

  // Fill credentials — wait for React hydration
  await page.waitForSelector('input[placeholder="e.g. acme-corp"]', { timeout: 15000 });
  await page.fill('input[placeholder="e.g. acme-corp"]', 'boothop');
  await page.fill('input[placeholder="Your password"]', 'BootHop2026!');
  await shot(page, '02_login_filled', 'Login credentials filled');

  // Submit and wait for Next.js client-side navigation to dashboard
  await Promise.all([
    page.waitForURL('**/commander/dashboard', { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle');
  await wait(1500);
  await shot(page, '03_dashboard', 'Dashboard (post-login)');

  // ── 2. NAVIGATE TO PIPELINE ───────────────────────────────────────────────
  console.log('\n── Step 2: My Pipeline ──');
  // If we landed on the dashboard, click through to the pipeline
  const url = page.url();
  if (!url.includes('/pipeline/')) {
    const pipelineLink = page.locator('a[href*="/commander/pipeline/boothop"]').first();
    if (await pipelineLink.count() > 0) {
      await pipelineLink.click();
      await page.waitForLoadState('networkidle');
      await wait(2000);
    } else {
      await page.goto(`${BASE}/commander/pipeline/boothop`);
      await page.waitForLoadState('networkidle');
      await wait(2000);
    }
  }
  await shot(page, '04_pipeline_landing', 'Pipeline landing page');

  // ── 3. PIPELINE SLOT CARDS ────────────────────────────────────────────────
  console.log('\n── Step 3: Slot Cards ──');
  // Click Pipeline tab inside CommanderNew (if tabs exist)
  await wait(2000);
  const pipelineBtn = page.locator('.tab-btn', { hasText: 'Pipeline' }).first();
  if (await pipelineBtn.count() > 0) {
    await pipelineBtn.click();
    await wait(2500);
  }
  await shot(page, '05_slots_loaded', 'Pipeline – all 4 slot cards');

  // ── 4. APPROVE BUTTON ─────────────────────────────────────────────────────
  console.log('\n── Step 4: Approve / Post ──');
  // Hover over the first ✅ All button to show tooltip
  const approveBtn = page.locator('.slot-actions .btn-success').first();
  if (await approveBtn.count() > 0) {
    await approveBtn.hover();
    await wait(500);
    await shot(page, '06_approve_hover', 'Approve All button (Slot 1)');
  }

  // ── 5. EDIT PANEL ─────────────────────────────────────────────────────────
  console.log('\n── Step 5: Edit Panel ──');
  const editBtn = page.locator('.slot-actions .btn-secondary[title="Edit text"]').first();
  if (await editBtn.count() > 0) {
    await editBtn.click();
    await wait(800);
    await shot(page, '07_edit_panel_open', 'Edit text panel – hook, problem, lesson, captions');

    // Type something in the hook field
    const hookTA = page.locator('.ef textarea').first();
    if (await hookTA.count() > 0) {
      await hookTA.click({ clickCount: 3 });
      await hookTA.type('She spent £47 on a last-minute flight. The gate closed in 8 minutes.');
      await wait(400);
      await shot(page, '08_edit_hook_typed', 'Hook text amended');
    }
    // Close panel
    const closeBtn = page.locator('.edit-ph .btn-secondary').first();
    await closeBtn.click();
    await wait(400);
  }

  // ── 6. REVOICE STUDIO ─────────────────────────────────────────────────────
  console.log('\n── Step 6: Revoice Studio ──');
  const revoiceTabBtn = page.locator('.tab-btn', { hasText: 'Revoice Studio' });
  await revoiceTabBtn.click();
  await wait(1500);
  await shot(page, '09_revoice_empty', 'Revoice Studio – empty state');

  // Load Slot 1 into revoice via Pipeline tab → 🎙 button
  const pipelineTab2 = page.locator('.tab-btn', { hasText: 'Pipeline' });
  await pipelineTab2.click();
  await wait(1000);
  const revoiceSlotBtn = page.locator('.slot-actions .btn-secondary[title="Revoice Studio"]').first();
  if (await revoiceSlotBtn.count() > 0) {
    await revoiceSlotBtn.click();
    await wait(1500);
    await shot(page, '10_revoice_slot_loaded', 'Revoice Studio – Slot 1 video + script auto-filled');
  }

  // ── 7. REVOICE — SCRIPT EDITING ───────────────────────────────────────────
  console.log('\n── Step 7: Script Edit + TTS ──');
  const scriptTA = page.locator('.rv-textarea');
  if (await scriptTA.count() > 0) {
    await scriptTA.click({ clickCount: 3 });
    await scriptTA.type('She spent £47 on a last-minute flight. The gate closed in 8 minutes. BootHop connects travellers instantly — download it today.');
    await wait(600);
    await shot(page, '11_script_edited', 'Script edited – ready for AI voiceover');

    // Click Generate AI Voiceover
    const ttsBtn = page.locator('button', { hasText: 'Generate AI Voiceover' });
    if (await ttsBtn.count() > 0 && !(await ttsBtn.isDisabled())) {
      await ttsBtn.click();
      await wait(600);
      await shot(page, '12_tts_generating', 'TTS generating…');
      // Wait up to 20s for TTS to finish
      try {
        await page.waitForFunction(
          () => document.querySelector('.voice-ready')?.textContent?.includes('AI voiceover'),
          { timeout: 20000 }
        );
        await shot(page, '13_tts_done', 'AI Voiceover ready – audio preview visible');
      } catch {
        await shot(page, '13_tts_timeout', 'TTS result (may need PIPELINE_BASE_URL)');
      }
    }
  }

  // ── 8. MUSIC SELECTOR ─────────────────────────────────────────────────────
  console.log('\n── Step 8: Music ──');
  const musicSel = page.locator('.music-sel');
  if (await musicSel.count() > 0) {
    const opts = await musicSel.locator('option').count();
    console.log(`   ${opts} music options loaded`);
    if (opts > 1) {
      await musicSel.selectOption({ index: 1 });
      await wait(600);
      await shot(page, '14_music_selected', `Music selected (${opts} tracks available)`);
    }
  }

  // ── 9. BAKE BUTTON ────────────────────────────────────────────────────────
  console.log('\n── Step 9: Bake Video ──');
  await shot(page, '15_bake_ready', 'Bake section – ready to bake');

  // ── 10. ONBOARD TAB ───────────────────────────────────────────────────────
  console.log('\n── Step 10: Onboard ──');
  const onboardBtn = page.locator('.tab-btn', { hasText: 'Onboard' });
  await onboardBtn.click();
  await wait(1500);
  await shot(page, '16_onboard_tab', 'Onboard – business profile form');

  // ── 11. ALL CLIENTS (SUPERADMIN) ─────────────────────────────────────────
  console.log('\n── Step 11: All Clients ──');
  const clientsBtn = page.locator('.tab-btn', { hasText: 'All Clients' });
  if (await clientsBtn.count() > 0) {
    await clientsBtn.click();
    await wait(1500);
    await shot(page, '17_all_clients', 'All Clients – superadmin client table');
  }

  // ── 12. SUMMARY SHOT ──────────────────────────────────────────────────────
  console.log('\n── Step 12: Final overview ──');
  const pipelineTab3 = page.locator('.tab-btn', { hasText: 'Pipeline' });
  await pipelineTab3.click();
  await wait(1500);
  await shot(page, '18_final_pipeline', 'Final – Pipeline overview with all slots');

  console.log('\n══════════════════════════════════════');
  console.log('  Demo complete!');
  console.log(`  ${OUT}`);
  console.log('══════════════════════════════════════');

  // Leave browser open for you to inspect
  await wait(5000);
  await browser.close();
})();

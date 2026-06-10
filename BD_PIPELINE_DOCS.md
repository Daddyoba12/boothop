# BootHop BD Pipeline — Documentation

## What is it?

An automated faceless social media content engine for the TikTok/Instagram page **"How things move around the world"**. It generates viral logistics/travel scripts using Claude AI, renders videos using Python, and publishes to TikTok and Instagram — all from within the BootHop web app.

---

## Architecture Overview

```
Windows Task Scheduler (4× daily)
        │
        ▼
generate_bd_content.py     ← Python: calls Claude API, generates content
        │
        ├──► Supabase (bd_content table)    stores script, hook, caption, hashtags
        ├──► render_bd_video.py             moviepy: renders 1080×1920 video
        └──► Supabase Storage (bd-videos)   uploads rendered .mp4
                │
                ▼
        Next.js Admin (/bdpipe_admin)
                │
                ├── Review & edit content
                ├── Approve for publishing
                ├── Trigger render jobs
                ├── Post to TikTok (PULL_FROM_URL)
                └── Post to Instagram (Graph API → Reel)
```

---

## Content Formula

Every piece of content follows this structure:

```
HOOK     → 1 line, <12 words, stops the scroll
PROBLEM  → 2-3 lines: what went wrong or what's at stake
STAKES   → 1-2 lines: why it matters
RESOLUTION → 2-3 lines: what happened or the solution
LESSON   → 1 punchy line: the takeaway
```

Plus: `CAPTION` (3-4 sentences with CTA), `HASHTAGS` (20 tags), `VISUAL_DESC` (shot guide).

---

## Content Pillars

| Pillar | Icon | Time slot | Focus |
|--------|------|-----------|-------|
| logistics_stories | 🚚 | 7am | Real logistics brand stories |
| travel_hacks | ✈️ | 12pm | Practical shipping/travel tips |
| airport_deliveries | 🛃 | 6pm | Dramatic airport logistics stories |
| supply_chain_failures | ⚠️ | 9pm | Famous supply chain disasters |

---

## Daily Schedule

| Slot | Time | Pillar |
|------|------|--------|
| 1 | 07:00 | logistics_stories |
| 2 | 12:00 | travel_hacks |
| 3 | 18:00 | airport_deliveries |
| 4 | 21:00 | supply_chain_failures |

The Windows Task Scheduler runs `generate_bd_content.py` at each of these times (tasks: `BootHopBD-Slot1` through `BootHopBD-Slot4`).

---

## A/B Testing

Each generated piece of content gets 3 hook variants:

- **Variant A** — the original hook
- **Variant B** — money angle (cost savings, earnings, financial stakes)
- **Variant C** — urgency angle (time pressure, last chance, crisis energy)

Stored in `bd_variants` table. Track performance per variant and mark the winner (`is_winner = true`) once data comes in.

---

## Performance Score Formula

```
score = views×1 + likes×3 + comments×4 + shares×6 + saves×5 + clicks×8 + conversions×20
```

Used to rank content in the Analytics page and identify which hook variants and pillars perform best.

---

## Content Status Flow

```
draft → review → approved → queued → rendering → rendered → posted → archived
```

- **draft** — just generated, not reviewed
- **review** — flagged for human review
- **approved** — ready to go into the publish pipeline
- **queued** — render job has been created
- **rendering** — Python is processing the video
- **rendered** — video is in Supabase Storage, ready to post
- **posted** — live on TikTok/Instagram
- **archived** — soft-deleted / retired

---

## Routes

### Viewer (public-ish, requires BD login)
- **`/BDpipe`** — Daily content viewer. Shows today's posts with date navigation, copyable captions/hashtags, video download.
- **`/BDpipe/login`** — OTP login (sends code to `oluwatoyinb@yahoo.com`)

### Admin (requires BD login)
- **`/bdpipe_admin`** — Overview dashboard: status counts, recent content, activity log
- **`/bdpipe_admin/generate`** — Generate new content: pick pillar/tone/platform or use slot quick-pick. Also "Generate all 4 slots" bulk button.
- **`/bdpipe_admin/library`** — Browse all content, filter by status/pillar, edit text, change status, view A/B variants.
- **`/bdpipe_admin/publish`** — Publish queue: render videos and post to TikTok/Instagram.
- **`/bdpipe_admin/analytics`** — Performance analytics: KPI cards, pillar breakdown, per-post scores and A/B comparison.

---

## Authentication

Both `/BDpipe` and `/bdpipe_admin` are protected by an OTP login:

1. User lands on the login page
2. "Send Code" is clicked — a 6-digit code is generated, SHA-256 hashed, stored in `email_login_codes`, and emailed to `oluwatoyinb@yahoo.com` via Resend
3. User enters the code — if valid (within 15 min), a `boothop_bd_session` JWT cookie is set (30-day expiry)
4. Cookie is verified on every request in the layout and API routes via `getBdSession()`

Only `oluwatoyinb@yahoo.com` can ever log in — the email is hardcoded in `BD_ALLOWED_EMAIL`.

---

## Video Rendering

Rendering happens on your Windows machine (not Vercel) via `render_bd_video.py`:

| Property | Value |
|----------|-------|
| Resolution | 1080 × 1920 (portrait) |
| Duration | ~45 seconds |
| Background | Dark (#0A0A12) |
| Music | `BootHopPipeline/music/daily/track_4.mp3` for slot 4 |
| Structure | Hook card (5s) → script segments (7s each) → end card (3s) |

The Python script uploads the rendered `.mp4` to Supabase Storage bucket `bd-videos`, then updates `bd_content.video_url` and sets `status = 'rendered'`.

---

## Publishing

### TikTok
- Method: `PULL_FROM_URL` (TikTok fetches the video from your Supabase Storage URL)
- No file upload needed from Vercel
- Requires: `BD_TIKTOK_TOKEN` env var (production token — currently sandbox)
- To go live: get TikTok Content Posting API approval, then paste the production `access_token` into your environment

### Instagram
- Method: Instagram Graph API → create Reel container → poll until FINISHED → publish
- Requires: `BD_INSTAGRAM_TOKEN` and `BD_INSTAGRAM_USER_ID` env vars
- The video URL must be publicly accessible (Supabase Storage `bd-videos` bucket is public)
- Token expires — you'll need to refresh the long-lived token every ~60 days

---

## Database Tables

All in Supabase (`bd_` prefix):

| Table | Purpose |
|-------|---------|
| `bd_content` | Main content: hook, script, caption, hashtags, visual_desc, status, analytics |
| `bd_variants` | A/B/C hooks per content item |
| `bd_render_jobs` | Video render job queue |
| `bd_posting_jobs` | Social posting job queue |
| `bd_notifications` | System activity log |

Migration files:
- `supabase/migrations/20260610_bd_posts.sql` — basic bd_posts + storage bucket
- `supabase/migrations/20260610_bd_advanced.sql` — advanced tables (run this in Supabase SQL editor)

---

## Environment Variables

Add these to your `.env.local` (or Vercel project settings):

```env
# BD Pipeline
BD_INSTAGRAM_TOKEN=IGAAgWs2S...          # Long-lived Instagram token
BD_INSTAGRAM_USER_ID=27317804164491362   # Instagram business account ID
BD_TIKTOK_TOKEN=                         # TikTok production token (empty = sandbox)

# Already in boothop .env:
ANTHROPIC_API_KEY=sk-ant-...             # Used by /api/bd/generate
RESEND_API_KEY=re_...                    # Used by /api/bd/auth (OTP emails)
APP_SESSION_SECRET=...                   # Used to sign BD JWT cookie
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Python Scripts (BootHopBDPipeline)

Located at: `C:\Users\babso\Desktop\BootHopBDPipeline\scripts\`

### Install dependencies
```bash
pip install anthropic httpx moviepy Pillow edge-tts
```

### Run manually
```bash
# Generate content for one slot
python generate_bd_content.py --slot 1

# With custom output path
python generate_bd_content.py --slot 2 --out C:\tmp\output.json

# Render video
python render_bd_video.py --json content.json --out output.mp4
```

### Windows Task Scheduler
Run `schedule-bd.ps1` as Administrator once to register the 4 scheduled tasks:
```powershell
.\schedule-bd.ps1
```

Tasks created: `BootHopBD-Slot1` (7am), `BootHopBD-Slot2` (12pm), `BootHopBD-Slot3` (6pm), `BootHopBD-Slot4` (9pm).

Each task runs as SYSTEM, uses `C:\Python314\python.exe`, starts even if the machine was sleeping (`StartWhenAvailable`, `WakeToRun`).

---

## Typical Daily Workflow

**Automated (no action needed):**
1. Task Scheduler fires at 7am → Python generates Slot 1 content → stores in Supabase
2. Repeats at 12pm, 6pm, 9pm for remaining slots

**Manual review (takes ~10 min/day):**
1. Open `/bdpipe_admin/library`
2. Review each draft — edit the hook/script/caption if needed
3. Change status to `approved`
4. Go to `/bdpipe_admin/publish`
5. Click "Render" for each approved item (Python on your machine processes it)
6. Once rendered, click "Post to TikTok" and/or "Post to Instagram"

**Check performance:**
- Open `/bdpipe_admin/analytics`
- Update `views`, `likes`, `shares` etc. on each bd_content row (from TikTok/IG dashboards)
- Mark winning A/B variant in `bd_variants.is_winner`

---

## File Locations

| What | Where |
|------|-------|
| Next.js app | `C:\Users\babso\Desktop\boothop\boothop` |
| Python scripts | `C:\Users\babso\Desktop\BootHopBDPipeline\scripts` |
| Music files | `C:\Users\babso\Desktop\BootHopPipeline\music\daily` |
| Social credentials | `C:\Users\babso\Desktop\BootHopPipeline\scripts\social_credentials.json` |
| BD pages (viewer) | `src/app/BDpipe/` |
| BD pages (admin) | `src/app/bdpipe_admin/` |
| BD API routes | `src/app/api/bd/` |
| Session auth | `src/lib/auth/session.ts` |

---

## Known Limitations & Next Steps

- **TikTok is in sandbox mode** — posts won't go live until you add a production `access_token` to `BD_TIKTOK_TOKEN`. Apply for TikTok Content Posting API access at developers.tiktok.com.
- **Instagram token expires** — long-lived tokens last ~60 days. Set a calendar reminder to refresh via the Graph API explorer.
- **Render happens on your machine** — the Publish page queues a render job, but Python must be running on your Windows machine to process it. There's no server-side video rendering on Vercel.
- **Analytics are manual** — view counts/likes must be pulled from TikTok/IG dashboards and entered manually into `bd_content`. No automatic sync yet.
- **A/B winner selection is manual** — compare variants in the Library/Analytics pages and toggle `is_winner` in Supabase directly (or build a UI for it).

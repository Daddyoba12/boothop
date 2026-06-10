# BootHop BD Pipeline — User Manual

**Page:** `@boothop.com1` · "How things move around the world"
**Admin access:** your-domain.com/bdpipe_admin
**Viewer access:** your-domain.com/BDpipe

---

## How it works in plain English

Every day your laptop and Vercel work together to run 4 posts automatically:

| Time | What happens |
|------|-------------|
| 7:00am | Vercel generates a script using Claude AI (logistics story) |
| 7:05am | Your laptop downloads real photos, renders a 45s video, posts to Instagram as a Reel |
| 12:00pm | Vercel generates script (travel hack) |
| 12:05pm | Laptop renders + posts |
| 6:00pm | Vercel generates script (airport story) |
| 6:05pm | Laptop renders + posts |
| 9:00pm | Vercel generates script (supply chain story) |
| 9:05pm | Laptop renders + posts |

**You don't need to do anything for this to run.** Just keep your laptop on and connected to the internet.

---

## Logging in

Both the admin and the viewer require a one-time login.

1. Go to `/bdpipe_admin/login` or `/BDpipe/login`
2. Click **Send Code** — a 6-digit code is emailed to `oluwatoyinb@yahoo.com`
3. Enter the code and click **Access Dashboard**
4. You stay logged in for 30 days

---

## The Admin Console (`/bdpipe_admin`)

### ⚡ Overview
Your dashboard home. Shows:
- **Status counts** — how many posts are draft, approved, posted etc.
- **Recent content** — last 6 items generated with their scores
- **Activity log** — what the system has done (generation, posts, errors)

Click any notification to mark it as read.

---

### ✨ Generate
Create content manually on demand (outside the automated schedule).

**Quick way — use slot buttons:**
1. Click one of the 4 slot buttons (sets pillar + time automatically)
2. Click **Generate**
3. Review the hook and A/B variants
4. Go to Library to approve

**Custom way:**
1. Pick a Pillar, Tone, and Platform
2. Click **Generate**

**Generate all 4 slots at once:**
Click **⚡ Generate all 4 slots** — creates one post for each time slot in sequence. Useful if the automated run failed overnight or you want to get ahead.

---

### 📚 Library
All your content in one place. Use this for daily review.

**Filters:**
- Filter by status (draft, approved, posted etc.)
- Filter by pillar (logistics, travel hacks etc.)

**For each post you can:**
- **▼ Expand** — see the full script, A/B variants, hashtags, visual description
- **✏️ Edit** — rewrite the hook, script, caption, hashtags, or visual description before it goes live
- **→ Change status** — move content through the pipeline (draft → approved → archived)
- **🗑 Delete** — remove it entirely

**Status guide:**
| Status | Meaning |
|--------|---------|
| `draft` | Just generated, not reviewed yet |
| `review` | Flagged — needs a closer look |
| `approved` | Ready to render and post |
| `queued` | Render job created, waiting for laptop |
| `rendering` | Laptop is processing the video right now |
| `rendered` | Video ready, waiting to post |
| `posted` | Live on Instagram / TikTok ✅ |
| `archived` | Retired, kept for reference |

---

### 🚀 Publish
For manual posting — when you want to post something outside the automated schedule, or re-post something.

**Workflow:**
1. First approve the content in Library (status → `approved`)
2. It appears here in the publish queue
3. Click **🎬 Render** — your laptop will pick this up and render the video
4. Once rendered (status = `rendered`), two buttons appear:
   - **↑ TikTok** — posts directly to TikTok
   - **↑ Instagram** — posts as a Reel to `@boothop.com1`

> **Note:** Rendering happens on your laptop (not Vercel). Your machine must be on for this to work.

---

### 📊 Analytics
Track which content performs best.

**What you see:**
- Total views, likes, conversions across all posted content
- Views broken down by pillar (bar chart)
- Ranked list of every post with its score

**Performance score formula:**
```
Score = views×1 + likes×3 + comments×4 + shares×6 + saves×5 + clicks×8 + conversions×20
```

**A/B variant comparison:**
Each post has 3 hook versions (A = original, B = money angle, C = urgency angle). Once you've run a post, compare which variant got more clicks and mark the winner — future content will lean into what works.

> Analytics data currently needs to be updated manually from your Instagram/TikTok dashboards. Enter the numbers directly in Supabase (`bd_content` table) or we can add an analytics sync later.

---

## The Viewer (`/BDpipe`)

A clean read-only page showing each day's content — good for quickly reviewing what went out.

- Use the **‹ ›** arrows to go back or forward by day
- Click **▼ Full script** to expand the complete script
- **Copy caption** / **Copy hashtags** — one click copy for manual posting
- **📋 Copy all** — copies caption + hashtags together
- **⬇ Download** — downloads the rendered video file

---

## Content pillars explained

| Pillar | Time | What it covers |
|--------|------|---------------|
| 🚚 Logistics Stories | 7am | Real brand stories — DHL crises, African startups, courier disruption |
| ✈️ Travel Hacks | 12pm | Practical tips — customs, shipping abroad, luggage savings |
| 🛃 Airport Deliveries | 6pm | Dramatic airport moments — missed packages, last-minute saves |
| ⚠️ Supply Chain Failures | 9pm | Famous disasters — Suez Canal, COVID PPE, port strikes |

Each piece of content follows the formula:
**HOOK → PROBLEM → STAKES → RESOLUTION → LESSON**

---

## A/B Testing

Every generated post gets 3 hook versions:
- **Variant A** — the original hook
- **Variant B** — money angle ("This mistake cost them £2 million...")
- **Variant C** — urgency angle ("They had 6 hours to fix it...")

The video is rendered with the Variant A hook by default. Once you see which hooks perform best in analytics, you can mark winners and use that style more in future generate sessions.

---

## What to check each morning

1. Open `/bdpipe_admin` — check the activity log. You should see a `✅ Slot 1 posted` notification from 7:05am
2. Check Instagram `@boothop.com1` — the Reel should be live
3. If you see a ❌ error in the log — check that your laptop was on. Go to Publish and manually re-render/post that slot

---

## Troubleshooting

**Video didn't post / error in activity log**
- Was your laptop on at 7:05am? If not, go to Library → find the queued item → change status to `approved` → go to Publish → Render → Post manually

**"No queued items" in the log but nothing posted**
- The Vercel cron may not have run. Go to Generate → click the slot button → generate manually → Publish

**Instagram says token error**
- Your Instagram token expires every ~60 days. Get a new long-lived token from Meta's Graph API Explorer and update `BD_INSTAGRAM_TOKEN` in Vercel environment variables

**TikTok not posting**
- TikTok is currently in sandbox mode. Production access requires approval from TikTok's Content Posting API programme. Posts will go live on TikTok once approved and the production token is added to `BD_TIKTOK_TOKEN`

**Content quality is off**
- Edit it in Library before it renders — change the hook, rewrite the script, adjust the caption
- Or delete it and regenerate with a different tone/template

---

## Key things to keep running

| What | How often | Action |
|------|-----------|--------|
| Laptop on during post times | Daily | Keep it on 7am–7:10am, 12pm–12:10pm, 6pm–6:10pm, 9pm–9:10pm |
| Instagram token refresh | Every ~60 days | Update `BD_INSTAGRAM_TOKEN` in Vercel settings |
| Review content quality | Daily (5 min) | Open /bdpipe_admin → Overview → check activity log |
| Mark A/B winners | Weekly | Open Analytics → identify top hook style → mark `is_winner` |

---

## Quick reference — URLs

| URL | What it is |
|-----|------------|
| `/bdpipe_admin` | Admin overview |
| `/bdpipe_admin/generate` | Generate content manually |
| `/bdpipe_admin/library` | Browse, edit, approve all content |
| `/bdpipe_admin/publish` | Render videos + post to socials |
| `/bdpipe_admin/analytics` | Performance scores + A/B results |
| `/BDpipe` | Daily viewer (read-only) |
| `/bdpipe_admin/login` | Admin login (OTP to oluwatoyinb@yahoo.com) |

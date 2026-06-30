# Commander System — Full Documentation
*Last updated: June 2026*

---

## What is Commander?

Commander is the **client login portal** for BootHop Pipeline clients. Each company that signs up to use the OTB pipeline gets their own Commander account. They use it to:

- Log in with a Company ID + password
- View their dashboard (plan, contact, assigned tracks)
- Manage music for their pipeline videos (add, remove, import from YouTube)

Commander is built into the **BootHop Next.js website** (`www.boothop.com/commander`) and stores all data in **Supabase**. It is completely separate from the Oracle dashboard (which runs on `140.238.73.32` and uses SQLite).

---

## Architecture Overview

```
                    ┌────────────────────────────────────┐
                    │     www.boothop.com/commander       │
                    │     (Next.js — Vercel)              │
                    │                                     │
                    │  /commander           ← login page  │
                    │  /commander/dashboard ← client home │
                    │  /commander/music     ← music mgmt  │
                    └──────────────┬─────────────────────┘
                                   │
                          reads/writes via
                       SUPABASE_SERVICE_ROLE_KEY
                                   │
                    ┌──────────────▼─────────────────────┐
                    │         Supabase (PostgreSQL)        │
                    │                                     │
                    │  pipeline_clients   ← accounts      │
                    │  commander_reset_tokens ← pwd reset │
                    │  music_tracks       ← track library  │
                    │  client_music       ← assignments   │
                    └──────────────┬─────────────────────┘
                                   │
                        pipeline syncs from Supabase
                                   │
                    ┌──────────────▼─────────────────────┐
                    │    Oracle Cloud VM (140.238.73.32)  │
                    │                                     │
                    │  OTB Pipeline — reads client_music  │
                    │  Downloads audio via yt-dlp         │
                    │  Uses track in video render         │
                    └────────────────────────────────────┘
```

---

## Entry Points — Every Route Explained

### Public (no login required)

---

#### `GET /commander`
**The login page.**

Shows three tabs:
- **Sign In** — Company ID + password → calls `/api/commander/login`
- **Create Account** — registers a new company → calls `/api/commander/register`
- **Reset Password** — sends a reset email → calls `/api/commander/reset`

File: `src/app/commander/page.tsx`

---

#### `GET /commander/reset?token=XXX`
**Password reset confirmation page.**

Reached by clicking the link in a password reset email. User enters a new password twice, submits to `/api/commander/reset` (step 2).

File: `src/app/commander/reset/page.tsx`

---

### API — Auth

---

#### `POST /api/commander/login`
**Verify Company ID + password, set session cookie.**

```json
Body: { "slug": "acme-media", "password": "..." }
```

1. Looks up `pipeline_clients` by `slug`
2. Runs `verifyPassword()` against stored `password_hash` (scrypt)
3. Checks `status !== 'inactive'`
4. Signs a JWT (`boothop_commander_session`, 7-day TTL)
5. Sets cookie, returns `{ ok: true, redirectTo: "/commander/dashboard" }`

File: `src/app/api/commander/login/route.ts`

---

#### `POST /api/commander/register`
**Create a new pipeline client account.**

```json
Body: { "company": "Acme Media", "slug": "acme-media", "email": "...", "contact_name": "...", "password": "...", "plan": "basic" }
```

1. Validates required fields (company, slug, password ≥ 8 chars)
2. Checks `slug` is not already taken in Supabase
3. Hashes password with `hashPassword()` (scrypt + random salt)
4. Inserts row into `pipeline_clients`
5. Signs JWT, sets cookie, returns `{ ok: true, redirectTo: "/commander/dashboard" }`

File: `src/app/api/commander/register/route.ts`

---

#### `POST /api/commander/logout`
**Clear session cookie.**

Sets `boothop_commander_session` to empty with `maxAge: 0`. No body required.

File: `src/app/api/commander/logout/route.ts`

---

#### `POST /api/commander/reset`
**Two-step password reset.**

**Step 1 — Request reset (send email):**
```json
Body: { "email": "john@acme.com" }
```
1. Looks up client by email in `pipeline_clients`
2. Generates a random 32-byte token, stores SHA-256 hash in `commander_reset_tokens` (1h expiry)
3. Sends reset link via Resend: `www.boothop.com/commander/reset?token=RAW_TOKEN`
4. Always returns `{ ok: true }` (never reveals if email exists)

**Step 2 — Confirm new password:**
```json
Body: { "token": "RAW_TOKEN", "newPassword": "..." }
```
1. Hashes the token, looks up in `commander_reset_tokens`
2. Checks not used and not expired
3. Updates `password_hash` in `pipeline_clients`
4. Marks token as `used: true`

File: `src/app/api/commander/reset/route.ts`

---

### Protected Pages (require `boothop_commander_session` cookie)

The middleware (`src/middleware.ts`) redirects to `/commander` if the cookie is missing.

---

#### `GET /commander/dashboard`
**Client home — stats, recent tracks, quick links.**

Server component. Reads session from cookie, fetches:
- Client row from `pipeline_clients` (plan, status, contact, email)
- Last 20 rows from `client_music` joined with `music_tracks`

Shows: stats cards, assigned tracks list, navigation links.

File: `src/app/commander/dashboard/page.tsx`

---

#### `GET /commander/music`
**Music management — full track library + YouTube import.**

Server component. Fetches:
- All rows from `music_tracks` (the shared BootHop library)
- All `client_music` rows for this client (to know which tracks are already assigned)

Passes to `MusicManager` client component which renders three tabs:

**Tab 1 — BootHop Library**
- Browse all tracks in the library
- Filter by genre or search by title/artist
- "+ Add" / "Remove" button per track → calls `/api/commander/music`

**Tab 2 — Add from YouTube**
- **Keyword search**: type artist/title → calls `/api/commander/youtube-search?q=...` → YouTube Data API v3
- **URL paste**: paste any YouTube link or video ID → calls `/api/commander/youtube-search?url=...` → YouTube oEmbed (keyless fallback)
- "+ Add" on result → calls `/api/commander/youtube-import`

**Tab 3 — My Tracks**
- Lists all tracks currently assigned to this client
- "Remove" button per track → calls `/api/commander/music` (DELETE)
- "▶ Preview" links to YouTube

Files: `src/app/commander/music/page.tsx`, `src/app/commander/music/MusicManager.tsx`

---

### API — Music

---

#### `POST /api/commander/music`
**Assign a track from the library to this client.**

```json
Body: { "trackId": "uuid" }
```
Upserts a row into `client_music` with `client_id` from session + `track_id`. Idempotent.

#### `DELETE /api/commander/music`
**Remove a track assignment.**

```json
Body: { "trackId": "uuid" }
```
Deletes the matching row from `client_music`.

File: `src/app/api/commander/music/route.ts`

---

#### `GET /api/commander/youtube-search?q=QUERY`
**Search YouTube for music by keyword.**

Uses `YOUTUBE_DATA_API_KEY` (YouTube Data API v3, Music category). Returns up to 8 results:
```json
{ "results": [{ "id": "...", "title": "...", "channel": "...", "thumbnail": "..." }] }
```
If the API key isn't configured or quota is hit, returns a friendly error and the UI falls back to URL paste.

#### `GET /api/commander/youtube-search?url=URL`
**Look up a single YouTube video by URL or video ID.**

Uses YouTube's free **oEmbed endpoint** — no API key, no quota. Accepts:
- Full URLs: `https://youtube.com/watch?v=dQw4w9WgXcQ`
- Short links: `https://youtu.be/dQw4w9WgXcQ`
- YouTube Shorts: `https://youtube.com/shorts/dQw4w9WgXcQ`
- Raw video ID: `dQw4w9WgXcQ`

Returns same shape as keyword search `results` array.

File: `src/app/api/commander/youtube-search/route.ts`

---

#### `POST /api/commander/youtube-import`
**Save a YouTube track to the library and assign it to this client.**

```json
Body: { "youtubeId": "dQw4w9WgXcQ", "title": "...", "artist": "..." }
```

1. Checks if `youtube_id` already exists in `music_tracks` (avoids duplicates)
2. If not, inserts a new row into `music_tracks` with `source: 'youtube'`
3. Upserts a row into `client_music` to assign it

**Note:** This only saves the YouTube video ID reference. The Oracle pipeline (`yt-dlp`) downloads the actual audio when it syncs.

File: `src/app/api/commander/youtube-import/route.ts`

---

## Supabase Tables

### `pipeline_clients`
One row per Commander account.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `slug` | TEXT | Company ID (login username) — unique, lowercase, hyphens |
| `company` | TEXT | Display name |
| `email` | TEXT | Contact email (used for password resets) |
| `contact_name` | TEXT | Primary contact person |
| `plan` | TEXT | `'basic'` or `'pro'` |
| `status` | TEXT | `'active'` or `'inactive'` |
| `platforms` | TEXT[] | Social platforms (TikTok, Instagram, etc.) |
| `password_hash` | TEXT | `SALT:HASH` — scrypt, 64-byte key |
| `created_at` | TIMESTAMPTZ | Auto |

### `commander_reset_tokens`
Password reset links (expire after 1 hour, single-use).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → `pipeline_clients.id` |
| `token_hash` | TEXT | SHA-256 of the raw token in the email link |
| `expires_at` | TIMESTAMPTZ | 1 hour from creation |
| `used` | BOOLEAN | Set to true after use |

### `music_tracks`
Shared BootHop music library. Available to all clients.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | TEXT | Track title |
| `artist` | TEXT | Artist / channel name |
| `genre` | TEXT | e.g. `'Afrobeats'`, `'YouTube'`, `'Lo-fi'` |
| `duration_seconds` | INTEGER | Track length |
| `source` | TEXT | `'library'` (curated) or `'youtube'` (imported) |
| `youtube_id` | TEXT | YouTube video ID — unique, nullable for library tracks |

### `client_music`
Many-to-many: which tracks are assigned to which client.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → `pipeline_clients.id` |
| `track_id` | UUID | FK → `music_tracks.id` |
| `assigned_at` | TIMESTAMPTZ | Auto |
| — | UNIQUE | `(client_id, track_id)` — no duplicates |

---

## Session / Auth Model

- Cookie name: `boothop_commander_session`
- Signed JWT: `APP_SESSION_SECRET`, audience `boothop-commander`, 7-day TTL
- Payload: `{ clientId, slug, company, email, commander: true }`
- Middleware (`src/middleware.ts`) checks this cookie on `/commander/dashboard` and `/commander/music`
- Password hashing: Node `crypto.scryptSync()` — 64-byte key, random 16-byte salt stored as `salt:hash`

---

## Music Flow: Commander → Oracle Pipeline

```
[Client in Commander]
  Searches YouTube or browses library
  Clicks "+ Add"
        │
        ▼
  /api/commander/music (POST)
  → inserts row: client_music (client_id, track_id)
  → if YouTube import: inserts row: music_tracks (youtube_id stored)
        │
        ▼
  Supabase (PostgreSQL)
        │
  [Oracle pipeline sync — runs on schedule]
        │
        ▼
  Queries: SELECT yt.youtube_id FROM music_tracks yt
           JOIN client_music cm ON cm.track_id = yt.id
           WHERE cm.client_id = '...' AND yt.source = 'youtube'
        │
        ▼
  yt-dlp downloads audio from YouTube
  Saves to: /opt/otb_pipeline/music/yt_downloads/{youtube_id}.mp3
        │
        ▼
  Pipeline uses track in next video render for that client
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/app/commander/page.tsx` | Login / Register / Reset tabs |
| `src/app/commander/reset/page.tsx` | Password reset confirmation |
| `src/app/commander/dashboard/page.tsx` | Client dashboard |
| `src/app/commander/music/page.tsx` | Music page (server wrapper) |
| `src/app/commander/music/MusicManager.tsx` | Music tabs UI (client component) |
| `src/lib/auth/commander.ts` | scrypt hashing, JWT sign/verify |
| `src/app/api/commander/login/route.ts` | Login endpoint |
| `src/app/api/commander/register/route.ts` | Register endpoint |
| `src/app/api/commander/logout/route.ts` | Logout endpoint |
| `src/app/api/commander/reset/route.ts` | Password reset (both steps) |
| `src/app/api/commander/music/route.ts` | Assign / revoke tracks |
| `src/app/api/commander/youtube-search/route.ts` | YouTube search + URL lookup |
| `src/app/api/commander/youtube-import/route.ts` | Import YouTube track to library |
| `src/components/commander/CommanderNav.tsx` | Navigation bar (all protected pages) |
| `src/middleware.ts` | Route protection |
| `docs/commander-migrations.sql` | Supabase SQL to run once |

---

## Environment Variables Used by Commander

| Variable | Where set | Purpose |
|---|---|---|
| `APP_SESSION_SECRET` | Vercel + `.env.local` | Signs Commander JWT cookies |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + `.env.local` | All Supabase DB access |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL |
| `RESEND_API_KEY` | Vercel + `.env.local` | Password reset emails |
| `YOUTUBE_DATA_API_KEY` | Vercel + `.env.local` | YouTube keyword search (optional) |
| `NEXT_PUBLIC_APP_URL` | Vercel + `.env.local` | Base URL for reset email links |

---

## How Commander Differs from the Oracle Dashboard

| | Commander (Next.js / Supabase) | Oracle Dashboard (FastAPI / SQLite) |
|---|---|---|
| URL | `www.boothop.com/commander` | `140.238.73.32` (via Vercel rewrite `→ /client-onboarding`) |
| Purpose | Music management for pipeline clients | Revoice Studio, bake history, admin panel |
| Database | Supabase PostgreSQL | SQLite `otb.db` |
| Auth | JWT cookie `boothop_commander_session` | Session token in SQLite `sessions` table |
| Admin | `/onboard/admin` (proxied to Oracle) | `/admin` on Oracle |

Clients will eventually use **both**: Commander for music, Oracle dashboard for revoicing. The two systems share the same client identity via `slug` but currently have separate auth.

---

*Commander System — BootHop Pipeline — v1.0 — June 2026*

# BootHop GPS Tracking & Delivery Handshake
## Full System Documentation — August 2026

---

## What This Document Covers

This document describes the complete GPS tracking system, delivery handshake (SecureSeal + PIN), and barcode tracking as built and deployed. It covers how everything works, which files are involved, and how to test each part.

---

## 1. GPS Tracking System

### How It Works

The traveller (carrier) shares their live location as they carry a package from one country to another. The sender watches progress in real time. Both use the same backend — mobile and web hit the same API endpoints.

### Journey Flow

```
Traveller                              Sender
────────                               ──────
Match goes "active"
  ↓
Opens Live Tracking screen             Opens Live Tracking screen
  ↓                                      ↓
Taps "Start Journey"                   Sees progress bar + timeline
  ↓                                    (auto-refreshes every 15 sec)
GPS starts sharing ───────────────────→ Location visible on map
  ↓
Logs milestones one by one:
  📦 Package Collected
  🛫 At Departure Airport
  ✈️  Flight Departed
  🛬 Flight Landed
  🏠 At Destination
  🚗 Out for Delivery
  ✅ Delivered  ────────────────────────→ Email + push sent to sender
  ↓
PIN handshake banner appears
```

### GPS Modes

| Mode | When | How |
|---|---|---|
| Background GPS | Dev build / standalone app with background permission | `expo-task-manager` + `startLocationUpdatesAsync` — survives screen lock and app minimize |
| Foreground fallback | Expo Go or background permission denied | `watchPositionAsync` — requires screen stay open |

**iOS:** Shows blue location bar at top while tracking. Requires `UIBackgroundModes: ["location"]` in `app.json` (already set).

**Android:** Shows a persistent foreground service notification ("BootHop is tracking your journey") while tracking is active. Requires `ACCESS_BACKGROUND_LOCATION` permission (already set in `app.json`).

Both platforms are fully supported. The same code path runs on iOS, Android, and web — only the fallback behaviour differs.

### Adaptive Ping Interval

| State | Ping frequency |
|---|---|
| Normal journey | Every 10 minutes |
| After "At Destination" or "Out for Delivery" | Every 2 minutes |

Switching to 2-minute pings updates both the background task (via AsyncStorage key `bh_loc_interval`) and the foreground fallback timer simultaneously.

### Offline Queue

If a GPS ping fails (no internet), it is stored in AsyncStorage (up to 50 pings). On the next successful ping, all queued pings are drained to the server. The traveller sees a yellow banner showing how many pings are queued.

### Photo Evidence

When logging any milestone, the traveller is offered the option to take a photo. The photo is uploaded to the `tracking-photos` Supabase Storage bucket and the URL is saved with the event. The sender can see "📷 Photo attached" on each milestone that has one.

### Notifications

| Milestone | Push | Email |
|---|---|---|
| Package Collected | ✅ Sender gets push | ❌ |
| At Departure Airport | ✅ Sender gets push | ❌ |
| Flight Departed | ✅ Sender gets push | ❌ |
| Flight Landed | ✅ Sender gets push | ❌ |
| At Destination | ✅ Sender gets push | ❌ |
| Out for Delivery | ✅ Sender gets push | ❌ |
| Delivered | ✅ Sender gets push | ✅ Sender gets delivery receipt email |

Push uses Expo Push for mobile, Web Push (VAPID) for browser.

---

## 2. Delivery Handshake (SecureSeal + PIN)

### Why Two Systems?

GPS tracking tells you where the package is. The PIN handshake is the legal and financial confirmation — it releases escrow to the traveller. They are intentionally separate:

- GPS `delivered` = traveller says "I'm here"
- PIN confirmed = both parties cryptographically agree delivery happened → money moves

### Full Handshake Sequence

```
1. SEAL GENERATION (Web — before travel)
   Sender/admin generates a SecureSeal QR code
   → unique seal number + raw token (shown once, never stored plaintext)
   → token_hash stored in shipment_secure_seals table

2. SEAL ACTIVATION (Mobile — at pickup)
   Traveller scans QR → 4-step flow:
     a. QR token verified (SHA-256 hash match)
     b. Seal number cross-checked
     c. Photo of sealed package uploaded to seal-photos bucket
     d. Weight recorded
   → match.status moves to "active"
   → Both parties get email + push

3. GPS TRACKING (During journey)
   Traveller logs 7 milestones with optional photo evidence
   → Each milestone fires push to sender
   → "delivered" fires delivery receipt email to sender

4. PIN GENERATION (Mobile — at delivery)
   Sender generates 6-digit PIN in app:
     → PIN SHA-256 hashed and stored on the seal record
     → Displayed to sender once (48px display)
     → Emailed to sender as backup

5. PIN CONFIRMATION (Mobile — at delivery)
   Traveller enters PIN in app:
     → 5-attempt lockout (admin SMS + email alert on lockout)
     → Correct PIN → match.status = "delivery_confirmed"
     → locked_at recorded (7-day dispute window)
     → Escrow releases 24 hours later
     → Both parties get push notification

6. ESCROW RELEASE (Automatic — 24h later)
   Payment released to traveller
```

### Security Properties

| Property | Implementation |
|---|---|
| PIN never stored plaintext | SHA-256 hash only |
| Brute-force protection | 5-attempt lockout with admin alert |
| Seal tamper evidence | Photo at activation, weight recorded |
| QR token one-time | Refreshing invalidates previous QR |
| Dispute window | 7 days from `locked_at` |
| Escrow hold | 24h after PIN confirmation |

### Gap Bridges (Implemented)

**Problem:** GPS "delivered" and PIN confirmation were disconnected — traveller could tap "Delivered" but sender wouldn't know to generate the PIN.

**Fix — Live tracking screen:**
After GPS "delivered" is logged, both parties see a green CTA:
- Traveller: "Enter Delivery PIN to release escrow →"
- Sender: "Generate Delivery PIN →"

**Fix — Match details screen:**
When `tracking_status = 'delivered'` but `status = 'active'` (escrow still locked), a green banner appears at the top of the match screen for both parties with role-specific instructions.

---

## 3. Barcode Tracking

### Two Barcodes Per Match

| Barcode | Who sees it | Purpose |
|---|---|---|
| `sender_barcode` | Sender | Sender tracks their package |
| `traveller_barcode` | Traveller | Carrier uses this barcode |

Each barcode shows a 9-step pipeline tracker. When the match is `active` (in transit), a "📍 View Live GPS Tracking →" button appears, deep-linking to the live GPS screen.

### API Endpoint

`GET /api/track/[barcode]` — no authentication required (public tracking)

Returns: `matchId`, `status`, `updatedAt`, `trip` (origin city/country/date), `request` (destination city/country)

---

## 4. Web Tracking (Browser)

The web tracking page (`/track/[matchId]`) mirrors the mobile but adds:
- **Wake Lock API** — prevents screen from sleeping while GPS is active
- **Page Visibility API** — shows a warning banner if the user switches tabs while GPS is active (GPS will stop in browser when tab is hidden)
- **Mapbox map** — shows the full GPS trail as a polyline

---

## 5. Files Reference

### Web (`boothop/`)

| File | Purpose |
|---|---|
| `src/app/api/track/[barcode]/route.ts` | Public barcode lookup API |
| `src/app/api/tracking/events/route.ts` | Logs milestones, fires notifications |
| `src/app/api/tracking/start/route.ts` | Starts tracking session |
| `src/app/api/tracking/ping/route.ts` | Receives GPS coordinates |
| `src/app/api/tracking/stop/route.ts` | Ends tracking session |
| `src/app/api/tracking/session/[matchId]/route.ts` | Returns full session data |
| `src/app/api/matches/[id]/delivery/pin/route.ts` | Sender generates delivery PIN |
| `src/app/api/matches/[id]/delivery/confirm-pin/route.ts` | Traveller confirms PIN |
| `src/app/api/matches/[id]/seal/generate/route.ts` | Generates SecureSeal QR |
| `src/app/api/matches/[id]/seal/activate/route.ts` | Activates seal at pickup |
| `src/app/track/[matchId]/page.tsx` | Web live tracking page |
| `src/lib/services/notifications.ts` | Push + email + SMS notifications |

### Mobile (`boothop-mobile/`)

| File | Purpose |
|---|---|
| `lib/locationTask.ts` | Background GPS task (registered at boot) |
| `app/_layout.tsx` | Imports locationTask at module level |
| `app/track/live/[matchId].tsx` | Live tracking screen (traveller + sender) |
| `app/track/[barcode].tsx` | Barcode pipeline tracker |
| `app/match/[id].tsx` | Match details with PIN handshake banner |
| `app/seal/[id]/index.tsx` | 4-step seal activation flow |
| `app/deliver/[id]/pin.tsx` | Sender PIN generation screen |
| `app/deliver/[id]/confirm.tsx` | Traveller PIN entry screen |
| `lib/api.ts` | All API calls; normalizeMatch includes trackingStatus |
| `app.json` | Background location permissions for iOS + Android |

### Supabase Storage Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `tracking-photos` | Public read / authenticated upload | Milestone photo evidence |
| `seal-photos` | Private | Seal activation photos |

---

## 6. Testing Guide

### Test the GPS Tracking (Mobile)

1. Run the app: `npx expo start`
2. Log in as the traveller of an active match
3. Go to **Match Details → 📍 Live Tracking**
4. Tap **Start Journey** — accept location permissions
5. Check the header shows "🔵 Live"
6. Tap a milestone (e.g. "Package Collected") — optionally take a photo
7. Log in as the sender on a second device/browser
8. Open the same match's Live Tracking — you should see the milestone appear within 15 seconds and receive a push notification
9. Continue through all 7 milestones
10. After tapping "Delivered":
    - The green PIN CTA should appear on the traveller's screen
    - The sender should see the "Generate Delivery PIN" CTA
    - The sender should receive a delivery receipt email

### Test the PIN Handshake

1. As sender: tap "Generate Delivery PIN" → note the 6-digit PIN
2. As traveller: tap "Enter Delivery PIN" → enter the PIN
3. Match status should move to `delivery_confirmed`
4. Both parties should receive a push notification

### Test the Barcode Tracker

1. Find a match that has `sender_barcode` set in the database
2. In the app: navigate to the barcode screen with that number
3. You should see the 9-step pipeline with the current step highlighted
4. If the match is `active`, the "📍 View Live GPS Tracking" button should appear
5. Tapping it should open the live tracking screen for that match

### Test Background GPS (requires dev build — not Expo Go)

1. Build a dev client: `eas build --profile development --platform ios` (or `android`)
2. Install the dev client on a physical device
3. Start a tracking session
4. Lock the phone / switch apps
5. Wait 10+ minutes
6. Unlock and return to the tracking screen — the offline queue counter should show pings were made in background (or the server should have received pings)

### Test the Web Tracking

1. Open `https://www.boothop.com/track/[matchId]` as the sender
2. While the traveller has GPS active, you should see the progress bar update every 15 seconds
3. Check the map tab for the GPS trail polyline
4. Minimise the browser tab — a yellow warning banner should appear when you return

---

## 7. Deploying Changes Live

See the separate deployment guide below.

---

## 8. iOS App Store & Google Play — What Changed

### What requires a new app build

| Change | New build needed? |
|---|---|
| Background GPS permissions (`app.json`) | ✅ Yes |
| `expo-task-manager` package added | ✅ Yes |
| `expo-location` plugin config updated | ✅ Yes |
| New screens (`app/track/live/`) | ✅ Yes |
| API/backend changes | ❌ No (web only) |
| Notification logic changes | ❌ No (web only) |

A new binary must be submitted to both stores because native permissions changed. The `app.json` already has the correct declarations for both platforms.

### iOS-specific notes
- `UIBackgroundModes: ["location"]` is set — Apple will ask during review why background location is needed. Answer: "The app is a peer-to-peer package delivery service. The carrier (traveller) shares their live location with the sender while physically carrying the package. Background location is required so GPS tracking continues when the carrier locks their phone during transit."
- Background location entitlement must be enabled in your Apple Developer account under the app's identifier capabilities.

### Android-specific notes
- `ACCESS_BACKGROUND_LOCATION` is declared in `app.json`
- Google Play requires a privacy policy and a Data Safety form declaration stating you collect location data in the background. This must be filled in on the Play Console before the new version is approved.
- The foreground service notification ("BootHop is tracking your journey") satisfies Android 8+ background location requirements.

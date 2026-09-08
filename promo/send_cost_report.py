"""Send paid infrastructure cost report to oluwatoyinb@yahoo.com."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SENDER   = "titobalo12@gmail.com"
PASSWORD = "howq mtby fbei ydzj"
TO       = "oluwatoyinb@yahoo.com"

PLAIN = """
BootHop Group - Paid Infrastructure Cost Report (August 2025)
==============================================================

1. BOOTHOP WEB (www.boothop.com)
---------------------------------
Vercel                 - Hosting, deployments, cron, edge       - Monthly Pro plan
Supabase               - PostgreSQL, storage, Realtime           - Monthly Pro plan
Anthropic Claude API   - AI safety check (claude-sonnet-4-6)    - Pay-per-token  [SHARED KEY]
Stripe                 - KYC identity verification               - Pay-per-verification
Resend                 - All transactional email                 - Monthly paid tier
WhatsApp Business API  - WhatsApp routing (Meta)                 - Pay-per-message above free
Google Maps API        - Route display, location autocomplete    - Pay-per-request above free
ElevenLabs             - Nigerian English TTS voice              - Monthly subscription  [SHARED KEY]

2. BOOTHOP MOBILE (iOS & Android, v1.2.0)
------------------------------------------
Expo EAS               - Production builds + OTA updates         - Monthly paid plan
Apple Developer        - App Store distribution                  - USD 99/year
Google Play Console    - Play Store distribution                 - USD 25 one-time
Stripe SDK (Live)      - In-app payment processing               - % per transaction
Supabase               - Shared with web plan

3. OTB PIPELINE (Content automation, Oracle server)
----------------------------------------------------
Oracle Cloud (OCI)     - Linux server 140.238.73.32, 24/7        - Monthly
Anthropic Claude API   - AI content generation                   - Pay-per-token  [SHARED KEY]
OpenAI API             - GPT-4 content generation                - Pay-per-token
Google Gemini API      - Alternative AI generation               - Pay-per-token (free tier)
Perplexity API         - Real-time web research                  - Monthly subscription
ElevenLabs             - TTS voice for video content             - Monthly  [SHARED KEY]
Kling AI               - AI video generation                     - Pay-per-video
Azure TTS              - Nigerian English voice                  - Free F0 - 500k chars/month
Zernio                 - Social media scheduling/publishing      - Monthly subscription
YouTube Data API       - Upload and manage YouTube content       - Free quota

4. ULTIMATE PIPELINE (boothop-creative-studio)
-----------------------------------------------
RunPod                 - GPU compute for AI video generation     - Pay-per-GPU-hour (key active)
FFmpeg / SQLite        - Video encoding, local database          - Free / open source

==============================================================
ACTION REQUIRED - SHARED KEYS TO SPLIT
==============================================================
The Anthropic API key and ElevenLabs key are currently shared
across BootHop Web, OTB Pipeline, and Ultimate Pipeline.
This makes it impossible to see which project is driving AI spend.

Anthropic - create 3 separate keys:
  - boothop-web
  - boothop-otb-pipeline
  - boothop-ultimate-pipeline

ElevenLabs - create 2 separate keys:
  - boothop-web
  - boothop-otb-pipeline

Once created, all config files will be updated per project.

Best regards,
Oluwatoyin Olufeko
Co-Founder, BootHop
www.boothop.com
"""

HTML = """
<html>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;max-width:700px;margin:0 auto;">

<div style="background:#020617;padding:20px 32px;">
  <h1 style="color:#fff;font-size:22px;margin:0;">BootHop Group</h1>
  <p style="color:#93c5fd;margin:6px 0 0;">Paid Infrastructure Cost Report &mdash; August 2025</p>
</div>

<div style="padding:28px 32px;">

<!-- Section 1 -->
<h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;">
  1. BootHop Web &mdash; www.boothop.com
</h2>
<table width="100%" cellpadding="9" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
  <tr style="background:#f1f5f9;font-weight:bold;">
    <td>Service</td><td>Purpose</td><td>Billing</td>
  </tr>
  <tr><td><b>Vercel</b></td><td>Hosting, deployments, cron jobs, edge network</td><td>Monthly Pro plan</td></tr>
  <tr style="background:#f8fafc;"><td><b>Supabase</b></td><td>PostgreSQL database, file storage, Realtime</td><td>Monthly Pro plan</td></tr>
  <tr><td><b>Anthropic Claude API</b></td><td>AI safety check (claude-sonnet-4-6)</td><td style="color:#b45309;">Pay-per-token &mdash; SHARED</td></tr>
  <tr style="background:#f8fafc;"><td><b>Stripe</b></td><td>KYC identity verification (Stripe Identity)</td><td>Pay-per-verification</td></tr>
  <tr><td><b>Resend</b></td><td>All transactional email</td><td>Monthly paid tier</td></tr>
  <tr style="background:#f8fafc;"><td><b>WhatsApp Business API</b></td><td>WhatsApp routing (Meta)</td><td>Pay-per-message above free</td></tr>
  <tr><td><b>Google Maps API</b></td><td>Route display, location autocomplete</td><td>Pay-per-request above free</td></tr>
  <tr style="background:#f8fafc;"><td><b>ElevenLabs</b></td><td>Nigerian English TTS voice</td><td style="color:#b45309;">Monthly &mdash; SHARED</td></tr>
</table>

<!-- Section 2 -->
<h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:32px;">
  2. BootHop Mobile &mdash; iOS &amp; Android (v1.2.0)
</h2>
<table width="100%" cellpadding="9" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
  <tr style="background:#f1f5f9;font-weight:bold;">
    <td>Service</td><td>Purpose</td><td>Billing</td>
  </tr>
  <tr><td><b>Expo EAS</b></td><td>Production builds (iOS + Android) and OTA updates</td><td>Monthly paid plan</td></tr>
  <tr style="background:#f8fafc;"><td><b>Apple Developer Program</b></td><td>App Store distribution</td><td>USD 99/year</td></tr>
  <tr><td><b>Google Play Console</b></td><td>Play Store distribution</td><td>USD 25 one-time</td></tr>
  <tr style="background:#f8fafc;"><td><b>Stripe SDK (Live)</b></td><td>In-app payment processing</td><td>% per transaction</td></tr>
  <tr><td><b>Supabase</b></td><td>Shared with web plan</td><td>Covered under web</td></tr>
</table>

<!-- Section 3 -->
<h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:32px;">
  3. OTB Pipeline &mdash; Content Automation (Oracle Server)
</h2>
<table width="100%" cellpadding="9" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
  <tr style="background:#f1f5f9;font-weight:bold;">
    <td>Service</td><td>Purpose</td><td>Billing</td>
  </tr>
  <tr><td><b>Oracle Cloud (OCI)</b></td><td>Linux server 140.238.73.32 &mdash; runs pipeline 24/7</td><td>Monthly</td></tr>
  <tr style="background:#fff3cd;"><td><b>Anthropic Claude API</b></td><td>AI content generation for clients</td><td style="color:#b45309;">Pay-per-token &mdash; SHARED KEY</td></tr>
  <tr><td><b>OpenAI API</b></td><td>GPT-4 content generation</td><td>Pay-per-token</td></tr>
  <tr style="background:#f8fafc;"><td><b>Google Gemini API</b></td><td>Alternative AI generation</td><td>Pay-per-token (has free tier)</td></tr>
  <tr><td><b>Perplexity API</b></td><td>Real-time web research for content</td><td>Monthly subscription</td></tr>
  <tr style="background:#fff3cd;"><td><b>ElevenLabs</b></td><td>TTS voice for video content</td><td style="color:#b45309;">Monthly &mdash; SHARED KEY</td></tr>
  <tr><td><b>Kling AI</b></td><td>AI video generation</td><td>Pay-per-video</td></tr>
  <tr style="background:#f8fafc;"><td><b>Azure TTS</b></td><td>Nigerian English voice (BootHop content)</td><td>Free F0 &mdash; 500k chars/month</td></tr>
  <tr><td><b>Zernio</b></td><td>Social media scheduling and publishing</td><td>Monthly subscription</td></tr>
  <tr style="background:#f8fafc;"><td><b>YouTube Data API</b></td><td>Upload and manage YouTube content</td><td>Free quota</td></tr>
</table>

<!-- Section 4 -->
<h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:32px;">
  4. Ultimate Pipeline &mdash; boothop-creative-studio
</h2>
<table width="100%" cellpadding="9" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
  <tr style="background:#f1f5f9;font-weight:bold;">
    <td>Service</td><td>Purpose</td><td>Billing</td>
  </tr>
  <tr><td><b>RunPod</b></td><td>GPU compute for AI video generation (active key deployed)</td><td>Pay-per-GPU-hour</td></tr>
  <tr style="background:#f8fafc;"><td><b>FFmpeg / SQLite / Docker</b></td><td>Video encoding, local database, containers</td><td>Free / open source</td></tr>
</table>

<!-- Action box -->
<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:18px 22px;margin-top:32px;">
  <h3 style="color:#92400e;margin:0 0 12px;">Action Required &mdash; Split Shared API Keys</h3>
  <p style="margin:0 0 10px;">
    The <b>Anthropic API key</b> and <b>ElevenLabs key</b> are currently shared across
    BootHop Web, OTB Pipeline, and Ultimate Pipeline. This makes it impossible to see
    which product is driving AI spend on the invoice.
  </p>
  <p style="margin:0 0 6px;"><b>Anthropic</b> (console.anthropic.com) &mdash; create 3 separate keys:</p>
  <ul style="margin:0 0 10px;padding-left:20px;font-size:13px;">
    <li>boothop-web</li>
    <li>boothop-otb-pipeline</li>
    <li>boothop-ultimate-pipeline</li>
  </ul>
  <p style="margin:0 0 6px;"><b>ElevenLabs</b> (elevenlabs.io) &mdash; create 2 separate keys:</p>
  <ul style="margin:0;padding-left:20px;font-size:13px;">
    <li>boothop-web</li>
    <li>boothop-otb-pipeline</li>
  </ul>
</div>

</div>

<div style="background:#f1f5f9;padding:16px 32px;font-size:12px;color:#64748b;">
  Oluwatoyin Olufeko &mdash; Co-Founder, BootHop &mdash; www.boothop.com
</div>
</body>
</html>
"""

msg = MIMEMultipart("alternative")
msg["From"]    = "Oluwatoyin Olufeko <titobalo12@gmail.com>"
msg["To"]      = TO
msg["Subject"] = "BootHop Group - Full Paid Infrastructure Cost Report (August 2025)"
msg.attach(MIMEText(PLAIN, "plain"))
msg.attach(MIMEText(HTML,  "html"))

with smtplib.SMTP_SSL("smtp.gmail.com", 465) as srv:
    srv.login(SENDER, PASSWORD)
    srv.sendmail(SENDER, TO, msg.as_string())
print("Sent to", TO)

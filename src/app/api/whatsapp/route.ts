import { NextResponse } from 'next/server';

const WA_NUMBER = process.env.WHATSAPP_NUMBER ?? '447506553755';
const WA_TEXT   = 'Hi BootHop, I found you via your website and would like to get in touch.';

export async function GET() {
  // Return an HTML page that opens the WhatsApp app via the whatsapp:// protocol.
  // The number never appears in the browser URL bar — the bar stays on /api/whatsapp.
  // After the app launches, JS navigates back to the site.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opening WhatsApp…</title>
  <style>
    body { margin: 0; display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif;
           background: #07111f; color: #fff; text-align: center; gap: 16px; }
    svg  { animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
    p    { color: rgba(255,255,255,.5); font-size: 14px; margin: 0; }
    a    { color: #25D366; font-size: 14px; }
  </style>
</head>
<body>
  <svg width="64" height="64" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
  <p>Opening WhatsApp…</p>
  <a href="/" id="back">← Back to BootHop</a>
  <script>
    var num  = '${WA_NUMBER}';
    var text = encodeURIComponent('${WA_TEXT}');
    // Try native app protocol first — no number in URL bar
    window.location.href = 'whatsapp://send?phone=' + num + '&text=' + text;
    // After 2.5 s, go back to the site regardless
    setTimeout(function() { window.location.href = '/'; }, 2500);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

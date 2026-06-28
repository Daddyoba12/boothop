import { sendResendEmail } from '@/lib/resend-client';

const FROM    = process.env.AUTH_FROM_EMAIL ?? 'BootHop <noreply@boothop.com>';
const ADMIN   = process.env.ADMIN_EMAIL     ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boothop.com';

export async function sendPriceDropAlert(opts: {
  origin:      string;
  destination: string;
  originCity:  string;
  destCity:    string;
  priceGbp:    number;
  prevPriceGbp: number;
  airlineName: string;
  routeSlug:   string;
}) {
  if (!ADMIN) return;
  const saving = (opts.prevPriceGbp - opts.priceGbp).toFixed(0);
  const routeUrl = `${APP_URL}/flights/${opts.routeSlug}`;

  await sendResendEmail({
    from:    FROM,
    to:      ADMIN,
    subject: `✈ Price drop: ${opts.originCity} → ${opts.destCity} now £${opts.priceGbp.toFixed(0)}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <p style="color:#60a5fa;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px;">
          BootHop Flight Intelligence
        </p>
        <h1 style="font-size:28px;margin:0 0 8px;">Price Drop Alert</h1>
        <p style="color:#9ca3af;margin:0 0 32px;">${opts.origin} → ${opts.destination}</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
          <tr>
            <td style="padding:16px;background:#111827;border-radius:8px 0 0 8px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">New Price</p>
              <p style="font-size:36px;font-weight:bold;margin:0;color:#fff;">£${opts.priceGbp.toFixed(0)}</p>
              <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">${opts.airlineName}</p>
            </td>
            <td style="padding:16px;text-align:center;width:80px;">
              <p style="font-size:24px;color:#34d399;margin:0;">↓ £${saving}</p>
            </td>
            <td style="padding:16px;background:#111827;border-radius:0 8px 8px 0;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Was</p>
              <p style="font-size:28px;font-weight:bold;margin:0;color:#6b7280;text-decoration:line-through;">£${opts.prevPriceGbp.toFixed(0)}</p>
            </td>
          </tr>
        </table>

        <a href="${routeUrl}"
           style="display:block;background:#2563eb;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;margin-bottom:24px;">
          View Route & Book →
        </a>

        <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">
          BootHop Flight Intelligence · Sent to admin only
        </p>
      </div>
    `,
  });
}

export async function sendDailySummaryEmail(opts: {
  date:    string;
  routes:  Array<{
    route:       string;
    priceGbp:    number | null;
    airline:     string | null;
    saving:      number | null;
    score:       number;
    signal:      string;
  }>;
  totalClicks: number;
}) {
  if (!ADMIN) return;

  const rows = opts.routes.map(r => `
    <tr style="border-bottom:1px solid #1f2937;">
      <td style="padding:10px;font-family:monospace;color:#e5e7eb;">${r.route}</td>
      <td style="padding:10px;color:#fff;font-weight:bold;">${r.priceGbp ? `£${r.priceGbp.toFixed(0)}` : '—'}</td>
      <td style="padding:10px;color:#9ca3af;">${r.airline ?? '—'}</td>
      <td style="padding:10px;color:${r.saving && r.saving > 0 ? '#34d399' : '#6b7280'};">
        ${r.saving && r.saving > 0 ? `↓ £${r.saving.toFixed(0)}` : '—'}
      </td>
      <td style="padding:10px;color:${r.signal === 'BUY' ? '#34d399' : r.signal === 'WAIT' ? '#f87171' : '#9ca3af'};">
        ${r.signal}
      </td>
    </tr>
  `).join('');

  await sendResendEmail({
    from:    FROM,
    to:      ADMIN,
    subject: `✈ BFI Daily — ${opts.date} · ${opts.totalClicks} clicks`,
    html: `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <p style="color:#60a5fa;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">
          BootHop Flight Intelligence
        </p>
        <h1 style="font-size:24px;margin:0 0 4px;">Daily Summary</h1>
        <p style="color:#9ca3af;margin:0 0 24px;">${opts.date} · ${opts.totalClicks} outbound clicks today</p>

        <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="border-bottom:1px solid #374151;">
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Route</th>
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Price</th>
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Airline</th>
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Saving</th>
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Signal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <a href="${APP_URL}/bfi"
           style="display:block;background:#1f2937;color:#9ca3af;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-size:14px;margin-top:24px;">
          Open Mission Control →
        </a>
      </div>
    `,
  });
}

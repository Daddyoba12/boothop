import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 14:00 UTC.
// Finds express quotes submitted but no job created from them within 24 hours.
// Sends a follow-up nudge to the contact email.

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const hrs24 = new Date(Date.now() - 24  * 3600000).toISOString();
  const hrs72 = new Date(Date.now() - 72  * 3600000).toISOString();

  // Express quotes that are 24–72 hours old and still status 'new' (not converted to a job)
  const { data: abandoned } = await supabase
    .from('express_quotes')
    .select('id, email, reference, from_location, to_location, delivery_type, package_size, estimated_price')
    .eq('status', 'new')
    .lte('created_at', hrs24)
    .gte('created_at', hrs72);

  for (const quote of abandoned ?? []) {
    const typeLabel = quote.delivery_type === 'uk' ? 'UK' : 'International';
    const sizeLabel: Record<string, string> = {
      small: 'Small', medium: 'Medium', large: 'Large', pallet: 'Pallet',
    };

    await resend.emails.send({
      from,
      to: quote.email,
      subject: `Still need your delivery sorted? — ${quote.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop Express</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Your booking is still available.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 20px;">You received a quote from us yesterday but didn't complete your booking. If you still need this delivery, we can have a carrier on the way within 20 minutes.</p>
          <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:20px;font-size:14px;">
            <p style="margin:0 0 8px;font-weight:700;">Your quote summary</p>
            <p style="margin:0 0 4px;">Route: <strong>${quote.from_location || '—'} → ${quote.to_location || '—'}</strong></p>
            <p style="margin:0 0 4px;">Type: ${typeLabel} · ${sizeLabel[quote.package_size] || quote.package_size || '—'}</p>
            ${quote.estimated_price ? `<p style="margin:0;font-size:16px;font-weight:900;color:#059669;">£${Number(quote.estimated_price).toLocaleString()}</p>` : ''}
          </div>
          <a href="https://boothop.com/business/express" style="display:inline-block;background:#059669;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">Complete your booking</a>
          <p style="margin-top:20px;font-size:13px;color:#64748b;">Or call us now: <strong>+44 115 661 2825</strong><br><a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a></p>
          <p style="margin-top:20px;font-size:11px;color:#94a3b8;">Reference: ${quote.reference}</p>
        </div>
      `,
      text: `Still need your delivery? Complete your BootHop Express booking:\nRoute: ${quote.from_location || '—'} → ${quote.to_location || '—'}\n${quote.estimated_price ? 'Price: £' + Number(quote.estimated_price).toLocaleString() : ''}\n\nCall: +44 115 661 2825\nbusiness@boothop.com\nRef: ${quote.reference}`,
    });
  }

  return NextResponse.json({ ok: true, nudged: abandoned?.length ?? 0 });
}

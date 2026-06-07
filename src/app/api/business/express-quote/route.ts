import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const PRICES: Record<string, Record<string, number>> = {
  uk:            { small: 300,  medium: 550,  large: 850,  pallet: 1400 },
  international: { small: 1000, medium: 1800, large: 2800, pallet: 4500 },
};

const SIZE_LABELS: Record<string, string> = {
  small:  'Small (doc / box)',
  medium: 'Medium (multiple boxes)',
  large:  'Large (oversized / pallet-equiv)',
  pallet: 'Pallet / large freight',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Step 1: quick quote inputs
      from_location,
      to_location,
      delivery_type,
      package_size,
      estimated_price,
      // Step 3–5: verified user and booking details
      email,
      pickup_address,
      pickup_contact,
      pickup_phone,
      delivery_address,
      delivery_contact,
      delivery_phone,
      special_instructions,
      reference,
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const price = estimated_price
      ?? (delivery_type && package_size ? PRICES[delivery_type]?.[package_size] : null)
      ?? null;

    const ref = reference || `BH-EXP-${Date.now().toString().slice(-6)}`;

    const { error: dbError } = await supabase.from('express_quotes').insert({
      email,
      from_location:        from_location        || null,
      to_location:          to_location          || null,
      delivery_type:        delivery_type        || null,
      package_size:         package_size         || null,
      estimated_price:      price,
      pickup_address:       pickup_address       || null,
      pickup_contact:       pickup_contact       || null,
      pickup_phone:         pickup_phone         || null,
      delivery_address:     delivery_address     || null,
      delivery_contact:     delivery_contact     || null,
      delivery_phone:       delivery_phone       || null,
      special_instructions: special_instructions || null,
      reference:            ref,
      status:               'new',
    });

    if (dbError) throw dbError;

    const typeLabel = delivery_type === 'uk' ? 'UK' : 'International';

    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

    // Admin notification
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⚡ Express Booking — ${ref} · ${email} · £${price?.toLocaleString() ?? '?'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Express</span>
          </div>
          <span style="font-size:11px;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New booking — action required within 20 minutes</span>
          <h2 style="margin:16px 0 4px;font-size:22px;font-weight:900;">${ref}</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px;">${typeLabel} · ${SIZE_LABELS[package_size] || package_size || '—'}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:180px;">Client email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;font-weight:700;">${from_location || '—'} → ${to_location || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Client price</td><td style="padding:8px 0;font-weight:900;color:#059669;font-size:18px;">£${price?.toLocaleString() ?? '?'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Partner rate (70%)</td><td style="padding:8px 0;font-weight:700;color:#0284c7;">£${price ? Math.round(price * 0.7).toLocaleString() : '?'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Pickup address</td><td style="padding:8px 0;">${pickup_address || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Pickup contact</td><td style="padding:8px 0;">${pickup_contact || '—'} ${pickup_phone ? '· ' + pickup_phone : ''}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Delivery address</td><td style="padding:8px 0;">${delivery_address || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Delivery contact</td><td style="padding:8px 0;">${delivery_contact || '—'} ${delivery_phone ? '· ' + delivery_phone : ''}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Special instructions</td><td style="padding:8px 0;">${special_instructions || '—'}</td></tr>
          </table>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;">
            <strong>⚠ Start carrier matching now.</strong> 20-minute window — cascade 50 → 75 → 100 miles.
            Partner rate <strong>NOT</strong> disclosed to carriers. Pay partner within <strong>1 week</strong> of confirmed delivery.
          </div>
        </div>
      `,
      text: `Express Booking ${ref}\n${email}\nRoute: ${from_location || '—'} → ${to_location || '—'}\nClient price: £${price?.toLocaleString() ?? '?'} (partner rate: £${price ? Math.round(price * 0.7) : '?'})\nPickup: ${pickup_address || '—'} · ${pickup_contact || '—'} ${pickup_phone || ''}\nDelivery: ${delivery_address || '—'} · ${delivery_contact || '—'} ${delivery_phone || ''}\nInstructions: ${special_instructions || '—'}`,
    });

    // Client confirmation email
    await resend.emails.send({
      from,
      to: email,
      subject: `✅ BootHop Express — Booking Confirmed · ${ref}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Express</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;">Booking confirmed.</h2>
          <p style="margin:0 0 24px;color:#64748b;">We have your booking and are matching a carrier now. Our team will be in touch within 30 minutes to confirm the carrier details.</p>
          <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#16a34a;letter-spacing:.05em;">Reference</p>
            <p style="margin:0;font-size:28px;font-weight:900;color:#15803d;font-family:monospace;">${ref}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:140px;">Route</td><td style="padding:8px 0;font-weight:600;">${from_location || '—'} → ${to_location || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Package size</td><td style="padding:8px 0;">${SIZE_LABELS[package_size] || package_size || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Service type</td><td style="padding:8px 0;">${typeLabel}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Amount</td><td style="padding:8px 0;font-weight:900;font-size:18px;">£${price?.toLocaleString() ?? '?'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Pickup</td><td style="padding:8px 0;">${pickup_address || '—'}</td></tr>
          </table>
          <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            Questions? Reply to this email or call <strong>0800 BOOTHOP</strong>. Keep your reference number handy.
          </p>
        </div>
      `,
      text: `BootHop Express — Booking Confirmed\n\nReference: ${ref}\nRoute: ${from_location || '—'} → ${to_location || '—'}\nPackage: ${SIZE_LABELS[package_size] || package_size || '—'}\nAmount: £${price?.toLocaleString() ?? '?'}\nPickup: ${pickup_address || '—'}\n\nWe're matching your carrier now and will confirm within 30 minutes.`,
    });

    return NextResponse.json({ ok: true, reference: ref });
  } catch (error) {
    console.error('express-quote error:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

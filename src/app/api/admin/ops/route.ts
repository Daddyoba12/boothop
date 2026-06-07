import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/ops — aggregated ops data for the live dashboard

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const now      = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const in7  = new Date(now.getTime() + 7  * 86400000).toISOString().slice(0, 10);
  const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const hrs2ago = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  const [
    { data: liveJobs },
    { data: todaysJobs },
    { data: certWarnings },
    { data: prioritySLABreaches },
    { data: carrierApplications },
    { data: priorityApplications },
    { data: activeCarriers },
    { data: matchLog },
  ] = await Promise.all([
    // Jobs currently active (urgent + in-progress)
    supabase
      .from('jobs')
      .select('id, reference, status, client_type, client_email, client_company, client_paid, partner_rate, boothop_margin, delivery_type, pickup_address, delivery_address, match_radius_miles, matched_at, assigned_at, is_boothop_direct, created_at')
      .in('status', ['received', 'matching', 'assigned', 'collected', 'in_transit'])
      .order('created_at', { ascending: true }),

    // Today's completed/all jobs for stats
    supabase
      .from('jobs')
      .select('id, status, client_paid, partner_rate, boothop_margin, is_boothop_direct, delivered_at, payment_released_at')
      .gte('created_at', todayStart),

    // Partner certification alerts
    supabase
      .from('carrier_profiles')
      .select('id, email, company_name, cert_expiry_date, insurance_expiry_date, status_active')
      .eq('status', 'active')
      .or(`cert_expiry_date.lte.${in30},insurance_expiry_date.lte.${in30}`),

    // Priority SLA breaches: applications > 2hrs with no AM call
    supabase
      .from('priority_partners')
      .select('id, email, company_name, phone, job_title, annual_fee, created_at, am_called_at')
      .eq('status', 'payment_pending')
      .is('am_called_at', null)
      .lte('created_at', hrs2ago),

    // Carrier applications awaiting payment
    supabase
      .from('carrier_profiles')
      .select('id, company_name, email, created_at, registration_fee_paid')
      .eq('status', 'payment_pending')
      .order('created_at', { ascending: false }),

    // Priority applications awaiting payment
    supabase
      .from('priority_partners')
      .select('id, company_name, email, annual_fee, delivery_type, created_at, am_called_at')
      .eq('status', 'payment_pending')
      .order('created_at', { ascending: false }),

    // Active partners count
    supabase
      .from('carrier_profiles')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .eq('status_active', true),

    // Recent match log for today (for match rate calculation)
    supabase
      .from('job_match_log')
      .select('job_id, response')
      .gte('alerted_at', todayStart),
  ]);

  // Compute today's stats
  const todaysAll       = todaysJobs ?? [];
  const todaysDelivered = todaysAll.filter(j => j.status === 'delivered');
  const todaysRevenue   = todaysDelivered.reduce((s, j) => s + (j.client_paid ?? 0), 0);
  const todaysMargin    = todaysDelivered.reduce((s, j) => s + (j.boothop_margin ?? 0), 0);
  const todaysPayout    = todaysDelivered.reduce((s, j) => s + (j.partner_rate ?? 0), 0);
  const directCount     = todaysDelivered.filter(j => j.is_boothop_direct).length;
  const partnerCount    = todaysDelivered.filter(j => !j.is_boothop_direct).length;

  // Split cert warnings into 7-day and 8-30-day buckets
  const certCritical = (certWarnings ?? []).filter(c => {
    const certDate = c.cert_expiry_date ? new Date(c.cert_expiry_date as string) : null;
    const insDate  = c.insurance_expiry_date ? new Date(c.insurance_expiry_date as string) : null;
    const in7Date  = new Date(now.getTime() + 7 * 86400000);
    return (certDate && certDate <= in7Date) || (insDate && insDate <= in7Date);
  });
  const certWarning = (certWarnings ?? []).filter(c => !certCritical.includes(c));

  return NextResponse.json({
    live_jobs:             liveJobs ?? [],
    today: {
      total:         todaysAll.length,
      delivered:     todaysDelivered.length,
      revenue:       todaysRevenue,
      margin:        todaysMargin,
      payout:        todaysPayout,
      partner_count: partnerCount,
      direct_count:  directCount,
    },
    cert_critical:         certCritical,
    cert_warning:          certWarning,
    sla_breaches:          prioritySLABreaches ?? [],
    carrier_applications:  carrierApplications ?? [],
    priority_applications: priorityApplications ?? [],
    active_carriers:       (activeCarriers as unknown as { count?: number } | null)?.count ?? 0,
    match_log:             matchLog ?? [],
  });
}

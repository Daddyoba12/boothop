export const dynamic = 'force-dynamic';

import { requireAdminPage } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import AmlReviewActions from './AmlReviewActions';

function riskBadge(level: string) {
  const styles: Record<string, string> = {
    low:      'bg-green-100 text-green-700',
    medium:   'bg-yellow-100 text-yellow-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${styles[level] ?? 'bg-slate-100 text-slate-600'}`}>
      {level}
    </span>
  );
}

export default async function CustomsAdminPage() {
  await requireAdminPage();
  const supabase = createSupabaseAdminClient();

  const [{ data: estimations }, { data: amlQueue }] = await Promise.all([
    supabase
      .from('customs_estimations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('aml_reviews')
      .select('*, customs_estimations(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
            Admin
          </a>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700">Customs &amp; Compliance</span>
        </div>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wide">Customs</span>
      </div>

    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customs &amp; Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          AML review queue and recent duty estimations.
        </p>
      </div>

      {/* AML Review Queue */}
      {amlQueue && amlQueue.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            AML Review Queue ({amlQueue.length})
          </h2>
          <div className="space-y-3">
            {amlQueue.map((review: {
              id: string;
              customs_estimations?: {
                item_description?: string;
                declared_value?: number;
                currency?: string;
                origin_country?: string;
                destination_country?: string;
              };
            }) => (
              <div
                key={review.id}
                className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {review.customs_estimations?.item_description ?? 'Unknown item'}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {review.customs_estimations?.currency}{' '}
                    {review.customs_estimations?.declared_value?.toLocaleString()} &middot;{' '}
                    {review.customs_estimations?.origin_country} &rarr;{' '}
                    {review.customs_estimations?.destination_country}
                  </p>
                </div>
                <AmlReviewActions reviewId={review.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(!amlQueue || amlQueue.length === 0) && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-700 font-medium">
          No pending AML reviews.
        </div>
      )}

      {/* Recent Estimations Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Recent Estimations</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-right">Declared Value</th>
                <th className="px-4 py-3 text-right">Est. Charges</th>
                <th className="px-4 py-3 text-center">Risk</th>
                <th className="px-4 py-3 text-center">AML</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimations?.map((est: {
                id: string;
                item_description?: string;
                origin_country?: string;
                destination_country?: string;
                currency?: string;
                declared_value?: number;
                estimated_total?: number;
                risk_level?: string;
                requires_aml_review?: boolean;
                created_at?: string;
              }) => (
                <tr key={est.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px] truncate">
                    {est.item_description ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {est.origin_country} &rarr; {est.destination_country}
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    {est.currency} {est.declared_value?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                    £{est.estimated_total?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {riskBadge(est.risk_level ?? 'low')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {est.requires_aml_review ? (
                      <span className="text-red-600 font-bold text-xs">Yes</span>
                    ) : (
                      <span className="text-green-600 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {est.created_at ? new Date(est.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {(!estimations || estimations.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No estimations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

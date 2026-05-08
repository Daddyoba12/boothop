'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, MapPin, FileText, AlertCircle, Plane, Globe, ShieldCheck } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
export default function CreateRequestPage() {
  const router   = useRouter();
  const supabase = createSupabaseClient();

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [customsAccepted,    setCustomsAccepted]    = useState(false);
  const [personalEffects,    setPersonalEffects]    = useState(false);
  const [underValueLimit,    setUnderValueLimit]    = useState(false);
  const [noHighValue,        setNoHighValue]        = useState(false);
  const [noProhibited,       setNoProhibited]       = useState(false);

  const [formData, setFormData] = useState({
    itemName: '', itemDescription: '', itemCategory: 'personal_effects',
    itemWeight: '', itemDimensions: '', itemValue: '',
    pickupCity: '', pickupCountry: '', deliveryCity: '', deliveryCountry: '',
    preferredPickupDate: '', flexibleUntil: '', specialInstructions: '',
    offeredPrice: '', urgency: 'normal' as 'normal' | 'urgent',
  });

  const countries = [
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
    'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Norway',
    'Denmark', 'Ireland', 'Portugal', 'Japan', 'South Korea', 'Singapore',
    'UAE', 'Nigeria', 'South Africa', 'Ghana', 'Kenya', 'India', 'China',
  ];

  const categories = [
    { value: 'personal_effects', label: 'Personal Effects' },
    { value: 'documents',        label: 'Documents & Letters' },
    { value: 'gifts',            label: 'Gifts' },
    { value: 'electronics',      label: 'Small Electronics' },
    { value: 'other',            label: 'Other' },
  ];

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      if (!formData.itemName || !formData.itemDescription)
        throw new Error('Please provide item name and description.');
      if (!formData.pickupCity || !formData.pickupCountry || !formData.deliveryCity || !formData.deliveryCountry)
        throw new Error('Please fill in all location fields.');
      if (!formData.preferredPickupDate || !formData.flexibleUntil)
        throw new Error('Please provide pickup dates.');
      if (new Date(formData.preferredPickupDate) >= new Date(formData.flexibleUntil))
        throw new Error('"Flexible until" must be after the preferred pickup date.');
      if (!formData.offeredPrice || Number(formData.offeredPrice) <= 0)
        throw new Error('Please enter a price.');

      const isIntl = formData.pickupCountry !== formData.deliveryCountry;
      if (isIntl) {
        if (!personalEffects)
          throw new Error('International shipments via BootHop must be personal effects only.');
        const val = Number(formData.itemValue);
        if (val > 1000)
          throw new Error('International personal effects must have a total declared value under £1,000. For higher-value shipments use our Business service.');
        if (!underValueLimit)
          throw new Error('Please confirm the total declared value is under £1,000.');
        if (!noHighValue)
          throw new Error('Please confirm no single item in this shipment exceeds £2,000.');
        if (!noProhibited)
          throw new Error('Please confirm the shipment contains no prohibited items.');
        if (!customsAccepted)
          throw new Error('Please accept your customs responsibilities for this international delivery.');
      }

      const { data: request, error: reqErr } = await supabase
        .from('delivery_requests')
        .insert({
          hooper_id:            user.id,
          item_name:            formData.itemName,
          item_description:     formData.itemDescription,
          item_category:        formData.itemCategory,
          item_weight_kg:       formData.itemWeight ? Number(formData.itemWeight) : null,
          item_dimensions:      formData.itemDimensions || null,
          item_value_amount:    formData.itemValue ? Number(formData.itemValue) : null,
          pickup_city:          formData.pickupCity,
          pickup_country:       formData.pickupCountry,
          delivery_city:        formData.deliveryCity,
          delivery_country:     formData.deliveryCountry,
          preferred_pickup_date: formData.preferredPickupDate,
          flexible_until:       formData.flexibleUntil,
          is_international:     isIntl,
          requires_customs:     isIntl,
          special_instructions: formData.specialInstructions || null,
          offered_price:        Number(formData.offeredPrice),
          urgency:              formData.urgency,
          status:               'open',
        })
        .select().single();

      if (reqErr) throw reqErr;
      router.push(`/requests/${request.id}`);
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isInternational = formData.pickupCountry && formData.deliveryCountry &&
    formData.pickupCountry !== formData.deliveryCountry;
  const hooперPays = formData.offeredPrice ? (Number(formData.offeredPrice) * 1.03).toFixed(2) : '0.00';

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Boot<span className="text-blue-600">Hop</span></span>
          </Link>
          <Link href="/hooper-dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Post a Delivery Request</h1>
          <p className="text-slate-500">Find a verified traveler to carry your item to its destination.</p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            BootHop handles <strong>personal effects, letters, and small parcels only</strong>.
            We are not responsible for items transported.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Item details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Item Details
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name *</label>
                <input type="text" value={formData.itemName} onChange={set('itemName')} required
                  placeholder="e.g. Documents, Birthday gift, Clothing"
                  className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <textarea value={formData.itemDescription} onChange={set('itemDescription')} required
                  rows={3} placeholder="Describe the item in detail..."
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select value={formData.itemCategory} onChange={set('itemCategory')} className={inputCls}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight (kg)</label>
                <input type="number" step="0.1" min="0" value={formData.itemWeight} onChange={set('itemWeight')}
                  placeholder="e.g. 0.5" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dimensions (L×W×H cm)</label>
                <input type="text" value={formData.itemDimensions} onChange={set('itemDimensions')}
                  placeholder="e.g. 30 × 20 × 10" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Declared Value (£)</label>
                <input type="number" step="0.01" min="0" value={formData.itemValue} onChange={set('itemValue')}
                  placeholder="e.g. 50" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" /> Route
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup City *</label>
                <input type="text" value={formData.pickupCity} onChange={set('pickupCity')} required
                  placeholder="e.g. Lagos" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup Country *</label>
                <select value={formData.pickupCountry} onChange={set('pickupCountry')} required className={inputCls}>
                  <option value="">Select country…</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery City *</label>
                <input type="text" value={formData.deliveryCity} onChange={set('deliveryCity')} required
                  placeholder="e.g. London" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Country *</label>
                <select value={formData.deliveryCountry} onChange={set('deliveryCountry')} required className={inputCls}>
                  <option value="">Select country…</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Timing & pricing */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" /> Timing &amp; Pricing
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Pickup Date *</label>
                <input type="date" value={formData.preferredPickupDate} min={new Date().toISOString().split('T')[0]} onChange={set('preferredPickupDate')}
                  required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Flexible Until *</label>
                <input type="date" value={formData.flexibleUntil} min={formData.preferredPickupDate || new Date().toISOString().split('T')[0]} onChange={set('flexibleUntil')}
                  required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Offered Price (£) *</label>
                <input type="number" step="0.01" min="1" value={formData.offeredPrice} onChange={set('offeredPrice')}
                  required placeholder="e.g. 30" className={inputCls} />
                {formData.offeredPrice && (
                  <p className="text-xs text-slate-500 mt-1">You pay £{hooперPays} total (inc. 3% service fee)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Urgency</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['normal', 'urgent'] as const).map((u) => (
                    <button key={u} type="button"
                      onClick={() => setFormData((p) => ({ ...p, urgency: u }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold capitalize transition ${
                        formData.urgency === u
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Special instructions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Special Instructions (optional)
            </label>
            <textarea value={formData.specialInstructions} onChange={set('specialInstructions')}
              rows={3} placeholder="Any special handling instructions…" className={inputCls} />
          </div>

          {/* International goods declaration (international routes only) */}
          {isInternational && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" /> International Goods Declaration
              </h2>
              <p className="text-sm text-slate-500">
                BootHop carries <strong>personal effects only</strong> on international routes.
                All items must comply with UK and destination country import rules.
              </p>

              {/* Value over-limit warning */}
              {formData.itemValue && Number(formData.itemValue) > 1000 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">
                    Declared value exceeds £1,000. BootHop international routes are for personal effects under £1,000.
                    For higher-value shipments please use our <a href="/business" className="underline">Business service</a>.
                  </p>
                </div>
              )}

              {/* Declarations */}
              <div className="space-y-3">
                {[
                  { checked: personalEffects,  set: setPersonalEffects,  label: 'These are personal effects — clothing, gifts, documents, or household items for personal use (not commercial goods for resale)' },
                  { checked: underValueLimit,  set: setUnderValueLimit,  label: 'The total declared value of all items combined is under £1,000' },
                  { checked: noHighValue,      set: setNoHighValue,      label: 'No single item in this shipment has a value exceeding £2,000' },
                  { checked: noProhibited,     set: setNoProhibited,     label: 'This shipment contains no prohibited items — no drugs, weapons, counterfeit goods, live animals, hazardous or flammable materials' },
                  { checked: customsAccepted,  set: setCustomsAccepted,  label: 'I accept customs responsibility for this international delivery and confirm all declared details are accurate and truthful' },
                ].map(({ checked, set, label }, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-600">{label}</span>
                  </label>
                ))}
              </div>

              {/* Duties estimator link */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                  Import duties and VAT may apply at destination.{' '}
                  <a href="/customs/duties" className="text-blue-600 hover:underline font-medium">
                    Estimate your landed cost →
                  </a>
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition shadow-sm hover:shadow-md"
          >
            {loading ? 'Creating Request…' : 'Post Delivery Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Weight, 
  DollarSign,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

export default function CreateJourneyPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fromCity: '',
    fromCountry: '',
    toCity: '',
    toCountry: '',
    departureDate: '',
    arrivalDate: '',
    flexibleUntil: '',
    availableSpaceKg: '',
    maxDimensions: '',
    pricePerDelivery: '',
    excludes: [] as string[],
    acceptsOnly: [] as string[],
  });

  const [newExclude, setNewExclude] = useState('');
  const [newAccept, setNewAccept] = useState('');

  const countries = [
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
    'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal',
    'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'UAE', 'Saudi Arabia',
    'Nigeria', 'South Africa', 'Ghana', 'Kenya', 'India', 'China'
  ];

  const handleAddExclude = () => {
    if (newExclude.trim()) {
      setFormData({
        ...formData,
        excludes: [...formData.excludes, newExclude.trim()]
      });
      setNewExclude('');
    }
  };

  const handleRemoveExclude = (index: number) => {
    setFormData({
      ...formData,
      excludes: formData.excludes.filter((_, i) => i !== index)
    });
  };

  const handleAddAccept = () => {
    if (newAccept.trim()) {
      setFormData({
        ...formData,
        acceptsOnly: [...formData.acceptsOnly, newAccept.trim()]
      });
      setNewAccept('');
    }
  };

  const handleRemoveAccept = (index: number) => {
    setFormData({
      ...formData,
      acceptsOnly: formData.acceptsOnly.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Validation
      if (!formData.fromCity || !formData.fromCountry || !formData.toCity || !formData.toCountry) {
        throw new Error('Please fill in all location fields');
      }

      if (!formData.departureDate || !formData.arrivalDate) {
        throw new Error('Please provide departure and arrival dates');
      }

      if (new Date(formData.departureDate) >= new Date(formData.arrivalDate)) {
        throw new Error('Arrival date must be after departure date');
      }

      if (!formData.availableSpaceKg || Number(formData.availableSpaceKg) <= 0) {
        throw new Error('Please specify available space (kg)');
      }

      // Check if international
      const isInternational = formData.fromCountry !== formData.toCountry;

      // Create journey
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          booter_id: user.id,
          from_city: formData.fromCity,
          from_country: formData.fromCountry,
          to_city: formData.toCity,
          to_country: formData.toCountry,
          departure_date: formData.departureDate,
          arrival_date: formData.arrivalDate,
          flexible_until: formData.flexibleUntil || null,
          available_space_kg: Number(formData.availableSpaceKg),
          max_dimensions: formData.maxDimensions || null,
          price_per_delivery: formData.pricePerDelivery ? Number(formData.pricePerDelivery) : null,
          excludes: formData.excludes.length > 0 ? formData.excludes : null,
          accepts_only: formData.acceptsOnly.length > 0 ? formData.acceptsOnly : null,
          status: 'active',
        })
        .select()
        .single();

      if (journeyError) throw journeyError;

      // Redirect to journey detail or dashboard
      router.push(`/journeys/${journey.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your journey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">BootHop</span>
            </Link>
            <Link href="/booter-dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Package className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Your Journey</h1>
            <p className="text-gray-600">Share your travel plans and earn money by delivering items</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Route Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                Your Route
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From City *
                  </label>
                  <input
                    type="text"
                    value={formData.fromCity}
                    onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
                    placeholder="e.g., London"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Country *
                  </label>
                  <select
                    value={formData.fromCountry}
                    onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To City *
                  </label>
                  <input
                    type="text"
                    value={formData.toCity}
                    onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
                    placeholder="e.g., Paris"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Country *
                  </label>
                  <select
                    value={formData.toCountry}
                    onChange={(e) => setFormData({ ...formData, toCountry: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* International Warning */}
              {formData.fromCountry && formData.toCountry && formData.fromCountry !== formData.toCountry && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">International Journey</p>
                      <p>
                        This is an international route. Both you and Hoopers must comply with customs regulations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dates Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Travel Dates
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flexible Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.flexibleUntil}
                    onChange={(e) => setFormData({ ...formData, flexibleUntil: e.target.value })}
                    min={formData.arrivalDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Can deliver up until this date</p>
                </div>
              </div>
            </div>

            {/* Capacity Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Weight className="h-6 w-6 text-blue-600" />
                Available Space
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Space (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.availableSpaceKg}
                    onChange={(e) => setFormData({ ...formData, availableSpaceKg: e.target.value })}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Total weight you can carry</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Dimensions (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.maxDimensions}
                    onChange={(e) => setFormData({ ...formData, maxDimensions: e.target.value })}
                    placeholder="e.g., 40x30x20 cm"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum package size</p>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-blue-600" />
                Pricing (Optional)
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Delivery
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.pricePerDelivery}
                    onChange={(e) => setFormData({ ...formData, pricePerDelivery: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to negotiate with Hoopers. You'll receive 95% after 5% service fee.
                </p>
              </div>
            </div>

            {/* Restrictions Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Item Restrictions (Optional)</h2>

              {/* Excludes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items You Won't Carry
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newExclude}
                    onChange={(e) => setNewExclude(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclude())}
                    placeholder="e.g., Electronics, Liquids"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddExclude}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                
                {formData.excludes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.excludes.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveExclude(index)}
                          className="hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Accepts Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Only Accept (Leave empty to accept all)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAccept}
                    onChange={(e) => setNewAccept(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAccept())}
                    placeholder="e.g., Documents, Letters"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccept}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                
                {formData.acceptsOnly.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.acceptsOnly.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveAccept(index)}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Journey...' : (
                  <>
                    Post Journey
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


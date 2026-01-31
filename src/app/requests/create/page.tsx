'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  FileText,
  DollarSign,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CreateRequestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customsAccepted, setCustomsAccepted] = useState(false);
  
  const [formData, setFormData] = useState({
    itemName: '',
    itemDescription: '',
    itemCategory: 'personal_effects',
    itemWeight: '',
    itemDimensions: '',
    itemValue: '',
    pickupCity: '',
    pickupCountry: '',
    deliveryCity: '',
    deliveryCountry: '',
    preferredPickupDate: '',
    flexibleUntil: '',
    specialInstructions: '',
    offeredPrice: '',
    urgency: 'normal' as 'normal' | 'urgent',
  });

  const countries = [
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
    'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal',
    'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'UAE', 'Saudi Arabia',
    'Nigeria', 'South Africa', 'Ghana', 'Kenya', 'India', 'China'
  ];

  const categories = [
    { value: 'personal_effects', label: 'Personal Effects' },
    { value: 'documents', label: 'Documents & Letters' },
    { value: 'gifts', label: 'Gifts' },
    { value: 'electronics', label: 'Small Electronics' },
    { value: 'other', label: 'Other' },
  ];

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
      if (!formData.itemName || !formData.itemDescription) {
        throw new Error('Please provide item name and description');
      }

      if (!formData.pickupCity || !formData.pickupCountry || !formData.deliveryCity || !formData.deliveryCountry) {
        throw new Error('Please fill in all location fields');
      }

      if (!formData.preferredPickupDate || !formData.flexibleUntil) {
        throw new Error('Please provide pickup dates');
      }

      if (new Date(formData.preferredPickupDate) >= new Date(formData.flexibleUntil)) {
        throw new Error('Flexible until date must be after preferred pickup date');
      }

      if (!formData.offeredPrice || Number(formData.offeredPrice) <= 0) {
        throw new Error('Please offer a price');
      }

      // Check if international
      const isInternational = formData.pickupCountry !== formData.deliveryCountry;
      
      if (isInternational && !customsAccepted) {
        throw new Error('You must acknowledge customs responsibilities for international deliveries');
      }

      // Create delivery request
      const { data: request, error: requestError } = await supabase
        .from('delivery_requests')
        .insert({
          hooper_id: user.id,
          item_name: formData.itemName,
          item_description: formData.itemDescription,
          item_category: formData.itemCategory,
          item_weight_kg: formData.itemWeight ? Number(formData.itemWeight) : null,
          item_dimensions: formData.itemDimensions || null,
          item_value_amount: formData.itemValue ? Number(formData.itemValue) : null,
          pickup_city: formData.pickupCity,
          pickup_country: formData.pickupCountry,
          delivery_city: formData.deliveryCity,
          delivery_country: formData.deliveryCountry,
          preferred_pickup_date: formData.preferredPickupDate,
          flexible_until: formData.flexibleUntil,
          is_international: isInternational,
          requires_customs: isInternational,
          special_instructions: formData.specialInstructions || null,
          offered_price: Number(formData.offeredPrice),
          urgency: formData.urgency,
          status: 'open',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Redirect to request detail or dashboard
      router.push(`/requests/${request.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your request');
    } finally {
      setLoading(false);
    }
  };

  const isInternational = formData.pickupCountry && formData.deliveryCountry && 
                          formData.pickupCountry !== formData.deliveryCountry;

  // Calculate what Hooper will actually pay (including 3% fee)
  const hooperPays = formData.offeredPrice ? 
    (Number(formData.offeredPrice) * 1.03).toFixed(2) : '0.00';

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
            <Link href="/hooper-dashboard" className="text-gray-600 hover:text-gray-900">
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
              <div className="p-4 bg-green-100 rounded-full">
                <Package className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Delivery Request</h1>
            <p className="text-gray-600">Find verified travelers to deliver your items safely</p>
          </div>

          {/* Disclaimer */}
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important</p>
                <p>
                  BootHop is for <strong>personal effects, letters, and small parcels only</strong>. 
                  We are not responsible for items transported.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Details Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-

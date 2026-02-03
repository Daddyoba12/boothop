// Database Types
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  user_type: 'booter' | 'hooper';
  phone?: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  created_at: string;
  updated_at: string;
};

export type Journey = {
  id: string;
  booter_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  departure_date: string;
  arrival_date: string;
  flexible_until?: string;
  available_space_kg: number;
  max_dimensions?: string;
  excludes?: string[];
  accepts_only?: string[];
  price_per_delivery?: number;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  delivery_matches: number;
  created_at: string;
  updated_at: string;
};

export type DeliveryRequest = {
  id: string;
  hooper_id: string;
  item_name: string;
  item_description: string;
  item_category?: string;
  item_weight_kg?: number;
  item_dimensions?: string;
  item_value_currency: string;
  item_value_amount?: number;
  pickup_city: string;
  pickup_country: string;
  delivery_city: string;
  delivery_country: string;
  preferred_pickup_date: string;
  flexible_until: string;
  is_international: boolean;
  requires_customs: boolean;
  special_instructions?: string;
  offered_price: number;
  status: 'draft' | 'open' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  urgency: 'normal' | 'urgent';
  item_photos?: string[];
  created_at: string;
  updated_at: string;
};

export type DeliveryMatch = {
  id: string;
  journey_id: string;
  request_id: string;
  booter_id: string;
  hooper_id: string;
  agreed_price: number;
  booter_fee_percentage: number;
  hooper_fee_percentage: number;
  hooper_pays: number;
  booter_receives: number;
  platform_fee: number;
  payment_status: 'pending' | 'escrowed' | 'released' | 'refunded';
  stripe_payment_intent_id?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'completed' | 'disputed' | 'cancelled';
  booter_confirmed_delivery: boolean;
  hooper_confirmed_receipt: boolean;
  hooper_confirmed_condition: boolean;
  booter_confirmed_at?: string;
  hooper_confirmed_at?: string;
  payment_released_at?: string;
  customs_declaration_accepted: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Rating = {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review?: string;
  communication_rating?: number;
  reliability_rating?: number;
  created_at: string;
};

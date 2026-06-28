export interface BFIAirport {
  code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  timezone: string;
  group_id: string | null;
}

export interface BFIAirline {
  code: string;
  name: string;
  logo_url: string | null;
  alliance: string | null;
  baggage_kg: number | null;
  rating: number;
}

export interface BFIRoute {
  id: string;
  origin: string;
  destination: string;
  enabled: boolean;
  priority: number;
  scan_frequency_hours: number;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export interface BFIFlightOffer {
  id: string;
  search_run_id: string | null;
  route_id: string;
  origin: string;
  destination: string;
  airline_code: string;
  airline_name: string;
  flight_number: string | null;
  departure_at: string;
  arrival_at: string;
  travel_time_mins: number | null;
  stops: number;
  price_gbp: number;
  currency: string;
  cabin: string;
  baggage_included: boolean;
  cabin_bag_incl: boolean;
  fare_class: string | null;
  refundable: boolean;
  change_fee_gbp: number | null;
  available_seats: number | null;
  booking_url: string | null;
  provider: string;
  scanned_at: string;
}

export interface BFISearchRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  routes_searched: number;
  offers_found: number;
  provider: string;
  status: 'running' | 'completed' | 'failed';
  error: string | null;
  duration_ms: number | null;
}

export interface BFIDailySummary {
  id: string;
  route_id: string;
  date: string;
  cheapest_price_gbp: number | null;
  average_price_gbp: number | null;
  highest_price_gbp: number | null;
  cheapest_airline_code: string | null;
  cheapest_airline_name: string | null;
  offers_count: number;
  saving_vs_yesterday_gbp: number | null;
  created_at: string;
}

export interface BFIRouteStats {
  route_id: string;
  all_time_lowest_gbp: number | null;
  all_time_highest_gbp: number | null;
  thirty_day_avg_gbp: number | null;
  ninety_day_avg_gbp: number | null;
  trend: 'rising' | 'falling' | 'stable';
  trend_pct: number | null;
  cheapest_airline_code: string | null;
  cheapest_airline_name: string | null;
  opportunity_score: number;
  recommendation: 'BUY' | 'WAIT' | 'HOLD';
  best_booking_window_days: number | null;
  best_month: string | null;
  last_updated: string;
}

export interface BFIAlert {
  id: string;
  route_id: string | null;
  type: 'price_drop' | 'lowest_ever' | 'price_rise' | 'daily_summary' | 'provider_offline';
  title: string;
  message: string;
  price_gbp: number | null;
  previous_price_gbp: number | null;
  airline_code: string | null;
  airline_name: string | null;
  severity: 'info' | 'success' | 'warning' | 'critical';
  read: boolean;
  created_at: string;
}

// Provider interface — one record per offer returned from a search
export interface RawFlightOffer {
  origin: string;
  destination: string;
  airlineCode: string;
  airlineName: string;
  flightNumber?: string;
  departureAt: Date;
  arrivalAt: Date;
  travelTimeMins: number;
  stops: number;
  priceGbp: number;
  cabin: string;
  baggageIncluded: boolean;
  cabinBagIncluded: boolean;
  fareClass?: string;
  refundable: boolean;
  changeFeeGbp?: number;
  availableSeats?: number;
  bookingUrl?: string;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: Date;
  adults?: number;
  cabin?: string;
}

// What the search engine returns for the dashboard
export interface MissionControlData {
  routesHealthy: number;
  routesAttention: number;
  biggestSavingGbp: number | null;
  biggestSavingRoute: string | null;
  bestOpportunityRoute: string | null;
  bestOpportunityScore: number | null;
  flightsMonitored: number;
  cheapestOneway: { route: string; price: number; airline: string } | null;
  cheapestReturn: { route: string; price: number; airline: string } | null;
  lastScanAt: string | null;
  avgScanMs: number | null;
  providersOnline: number;
  providersOffline: number;
  unreadAlerts: number;
  aiSummary: string;
}

export interface TickerEntry {
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  priceGbp: number;
  airlineName: string;
  rating: number;
  recommendation: string;
  opportunityScore: number;
  updatedAt: string;
  bookingUrl?: string;
}

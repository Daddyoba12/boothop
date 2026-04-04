import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Haversine distance in miles between two lat/lng points
function haversinemiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode a city name → { lat, lng } using Google Maps (returns null if unavailable)
async function geocode(city: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`;
    const res = await fetch(url);
    const json = await res.json();
    const loc = json.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

// Returns true if origin cities are within 20 miles of each other (passes if geocoding unavailable)
async function withinPickupRange(city1: string, city2: string): Promise<boolean> {
  const [c1, c2] = await Promise.all([geocode(city1), geocode(city2)]);
  if (!c1 || !c2) return true; // Can't verify — let it through
  return haversinemiles(c1.lat, c1.lng, c2.lat, c2.lng) <= 20;
}

// Matching logic
function calculateMatchScore(trip1: any, trip2: any) {
  let score = 0;

  // Exact route match
  if (
    trip1.from_city.toLowerCase() === trip2.from_city.toLowerCase() &&
    trip1.to_city.toLowerCase() === trip2.to_city.toLowerCase()
  ) {
    score += 50;
  }

  // Date proximity (within 3 days)
  const date1 = new Date(trip1.travel_date);
  const date2 = new Date(trip2.travel_date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) score += 30;
  else if (daysDiff <= 1) score += 20;
  else if (daysDiff <= 3) score += 10;

  // Price compatibility (within 20%)
  if (trip1.price && trip2.price) {
    const priceDiff = Math.abs((trip1.price - trip2.price) / trip1.price);
    if (priceDiff <= 0.2) score += 20;
  }

  return score;
}

export async function POST(request: Request) {
  try {
    // ✅ Initialize supabase inside the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tripId } = await request.json();

    // Get the new trip
    const { data: newTrip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (!newTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Find opposite type trips (sender looks for traveler, vice versa)
    const oppositeType = newTrip.type === 'send' ? 'travel' : 'send';
    
    const { data: potentialMatches } = await supabase
      .from('trips')
      .select('*')
      .eq('type', oppositeType)
      .eq('status', 'active')
      .gte('travel_date', new Date().toISOString().split('T')[0]);

    if (!potentialMatches || potentialMatches.length === 0) {
      return NextResponse.json({ message: 'No matches found yet' });
    }

    // Calculate match scores
    const matches = potentialMatches.map(trip => ({
      ...trip,
      score: calculateMatchScore(newTrip, trip)
    })).filter(m => m.score >= 60); // Minimum 60% match

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    // Create matches in database
    const createdMatches = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    for (const match of matches.slice(0, 3)) { // Top 3 matches
      // Distance check: pickup cities must be within 20 miles of each other
      const inRange = await withinPickupRange(newTrip.from_city, match.from_city);
      if (!inRange) {
        console.log(`Skipping match — pickup cities too far apart: ${newTrip.from_city} vs ${match.from_city}`);
        continue;
      }

      const isSender         = newTrip.type === 'send';
      const sender_trip_id   = isSender ? newTrip.id   : match.id;
      const traveler_trip_id = isSender ? match.id     : newTrip.id;
      const sender_user_id   = isSender ? newTrip.user_id : match.user_id;
      const traveler_user_id = isSender ? match.user_id   : newTrip.user_id;
      const senderPrice      = isSender ? newTrip.price : match.price;
      const travelerPrice    = isSender ? match.price   : newTrip.price;

      // Negotiation check: if prices differ by more than 20%, propose midpoint
      const priceDiff =
        senderPrice && travelerPrice
          ? Math.abs(senderPrice - travelerPrice) / Math.max(senderPrice, travelerPrice)
          : 0;
      const needsNegotiation = priceDiff > 0.2;
      const proposedPrice    = needsNegotiation
        ? Math.round(((senderPrice || 0) + (travelerPrice || 0)) / 2 * 100) / 100
        : null;
      const agreedPrice      = needsNegotiation
        ? null
        : Math.round(((senderPrice || 0) + (travelerPrice || 0)) / 2 * 100) / 100;

      const { data: matchRecord } = await supabase
        .from('matches')
        .insert([{
          sender_trip_id,
          traveler_trip_id,
          sender_user_id,
          traveler_user_id,
          status:             'matched',
          agreed_price:       agreedPrice,
          proposed_price:     proposedPrice,
          negotiation_status: needsNegotiation ? 'pending' : null,
        }])
        .select()
        .single();

      if (!matchRecord) continue;
      createdMatches.push(matchRecord);

      // In-app notifications
      await supabase.from('notifications').insert([
        {
          user_id:  newTrip.user_id,
          match_id: matchRecord.id,
          type:     'new_match',
          message:  needsNegotiation
            ? `Match found (price negotiation needed): ${match.from_city} → ${match.to_city}`
            : `New match found: ${match.from_city} → ${match.to_city}`,
        },
        {
          user_id:  match.user_id,
          match_id: matchRecord.id,
          type:     'new_match',
          message:  needsNegotiation
            ? `Match found (price negotiation needed): ${newTrip.from_city} → ${newTrip.to_city}`
            : `New match found: ${newTrip.from_city} → ${newTrip.to_city}`,
        },
      ]);

      // Fire emails — negotiation or standard match
      try {
        const emailRoute = needsNegotiation
          ? `/api/matches/send-negotiation-email`
          : `/api/send-match-email`;
        await fetch(`${appUrl}${emailRoute}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ matchId: matchRecord.id }),
        });
      } catch (emailErr) {
        console.error('Match email failed (non-blocking):', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      matches: createdMatches,
      count: createdMatches.length
    });

  } catch (error) {
    console.error('Matching error:', error);
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 });
  }
}

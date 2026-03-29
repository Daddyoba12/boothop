import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for admin operations
);

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
    for (const match of matches.slice(0, 3)) { // Top 3 matches
      const sender_trip_id = newTrip.type === 'send' ? newTrip.id : match.id;
      const traveler_trip_id = newTrip.type === 'travel' ? newTrip.id : match.id;

      const { data: matchRecord } = await supabase
        .from('matches')
        .insert([{
          sender_trip_id,
          traveler_trip_id,
          status: 'pending'
        }])
        .select()
        .single();

      createdMatches.push(matchRecord);

      // Create notifications for both users
      await supabase.from('notifications').insert([
        {
          user_id: newTrip.user_id,
          match_id: matchRecord.id,
          type: 'new_match',
          message: `New match found: ${match.from_city} → ${match.to_city}`
        },
        {
          user_id: match.user_id,
          match_id: matchRecord.id,
          type: 'new_match',
          message: `New match found: ${newTrip.from_city} → ${newTrip.to_city}`
        }
      ]);
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

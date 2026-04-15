import { NextRequest, NextResponse } from 'next/server';

// Returns the user's country code via Vercel's geo headers (production)
// or a null fallback for local dev — no external API call needed.
export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') || null;
  return NextResponse.json({ country_code: country });
}

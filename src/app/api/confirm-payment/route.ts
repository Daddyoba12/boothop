import { NextResponse } from 'next/server';

// Legacy endpoint — payment confirmation is now handled via admin manual flow.
export async function POST() {
  return NextResponse.json({ ok: true });
}

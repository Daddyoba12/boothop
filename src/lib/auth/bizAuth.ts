import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession, getBizSessionFromBearer } from './session';

// Resolves a business session from either:
//   1. boothop_biz_session cookie (web portal)
//   2. Authorization: Bearer <jwt> header (mobile app — accepts biz or P2P JWT)
export async function requireBizAuth(
  request: NextRequest,
): Promise<{ email: string } | NextResponse> {
  const cookieStore = await cookies();
  const fromCookie  = getBizSession(cookieStore);
  if (fromCookie) return fromCookie;

  const fromBearer = getBizSessionFromBearer(request.headers.get('Authorization'));
  if (fromBearer) return fromBearer;

  return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
}

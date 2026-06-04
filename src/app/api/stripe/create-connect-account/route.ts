import { NextRequest, NextResponse } from 'next/server';
import { createConnectAccount, createOnboardingLink } from '@/lib/services/stripe-connect';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, country')
      .eq('email', session.email)
      .single();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { accountId, alreadyExists } = await createConnectAccount(user.id, user.email, user.country || 'GB');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    const onboardingUrl = await createOnboardingLink(
      user.id,
      `${appUrl}/traveller/onboarding/refresh`,
      `${appUrl}/traveller/onboarding/complete`
    );

    return NextResponse.json({ success: true, accountId, onboardingUrl, alreadyExists });
  } catch (err: any) {
    console.error('create-connect-account error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

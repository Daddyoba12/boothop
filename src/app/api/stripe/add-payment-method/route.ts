import { NextRequest, NextResponse } from 'next/server';
import { savePaymentMethod } from '@/lib/services/stripe-connect';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { paymentMethodId } = await req.json();
    if (!paymentMethodId) return NextResponse.json({ error: 'paymentMethodId required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await savePaymentMethod(user.id, paymentMethodId);

    return NextResponse.json({ success: true, message: 'Payment method saved' });
  } catch (err: any) {
    console.error('add-payment-method error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

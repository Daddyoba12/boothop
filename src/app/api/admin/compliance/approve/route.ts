import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; decision: 'approve' | 'reject'; note?: string };
    const { id, decision, note } = body;

    if (!id || !decision) {
      return NextResponse.json({ error: 'id and decision are required' }, { status: 400 });
    }
    if (decision !== 'approve' && decision !== 'reject') {
      return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('compliance_requests')
      .update({
        admin_decision: decision === 'approve' ? 'APPROVED' : 'REJECTED',
        admin_note:     note ?? null,
        status:         decision === 'approve' ? 'ALLOWED' : 'PROHIBITED',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, request: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update compliance request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

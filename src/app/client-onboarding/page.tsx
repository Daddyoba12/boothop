import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import CommanderNav from '@/components/commander/CommanderNav';
import OnboardForm from './OnboardForm';

export const dynamic = 'force-dynamic';

export default async function ClientOnboardingPage() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');

  const db = createSupabaseAdminClient();
  const { data: profile } = await db
    .from('company_profiles')
    .select('*')
    .eq('company_id', session.clientId)
    .single();

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <CommanderNav company={session.company} slug={session.slug} isSuper={session.isSuper} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Pipeline Onboarding</h1>
          <p className="text-sm text-white/40 mt-1">Your profile powers the AI pipeline — keep it accurate.</p>
        </div>
        <OnboardForm clientId={session.clientId} profile={profile ?? null} />
      </main>
    </div>
  );
}

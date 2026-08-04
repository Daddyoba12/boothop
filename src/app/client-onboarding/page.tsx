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

  // Fetch saved profile AND the base client record in parallel
  const [{ data: profile }, { data: client }] = await Promise.all([
    db.from('company_profiles').select('*').eq('company_id', session.clientId).single(),
    db.from('pipeline_clients').select('company, contact_name, email, platforms').eq('id', session.clientId).single(),
  ]);

  // Pre-seed empty profile fields from pipeline_clients registration data
  const seeded = {
    business_name:  profile?.business_name  || client?.company       || '',
    contact_name:   profile?.contact_name   || client?.contact_name  || '',
    email:          profile?.email          || client?.email         || '',
    phone:          profile?.phone          || '',
    website:        profile?.website        || '',
    bio:            profile?.bio            || '',
    platforms_json: profile?.platforms_json || (client?.platforms?.length ? JSON.stringify(client.platforms) : '[]'),
    tg_chat_id:     profile?.tg_chat_id     || '',
    whatsapp:       profile?.whatsapp       || '',
    custom_1_label: profile?.custom_1_label || '', custom_1_value: profile?.custom_1_value || '',
    custom_2_label: profile?.custom_2_label || '', custom_2_value: profile?.custom_2_value || '',
    custom_3_label: profile?.custom_3_label || '', custom_3_value: profile?.custom_3_value || '',
    custom_4_label: profile?.custom_4_label || '', custom_4_value: profile?.custom_4_value || '',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CommanderNav company={session.company} slug={session.slug} isSuper={session.isSuper} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Your profile powers the AI pipeline — keep it accurate.</p>
        </div>
        <OnboardForm clientId={session.clientId} profile={seeded} />
      </main>
    </div>
  );
}

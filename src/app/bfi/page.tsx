import { requireAdminPage } from '@/lib/auth/admin';
import MissionControl from './MissionControl';

export const dynamic = 'force-dynamic';

export default async function BFIPage() {
  await requireAdminPage();
  return <MissionControl />;
}

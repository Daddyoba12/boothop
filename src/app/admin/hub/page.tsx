import { requireAdminPage } from '@/lib/auth/admin';
import AdminHubClient from './hub-client';

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
  await requireAdminPage();
  return <AdminHubClient />;
}

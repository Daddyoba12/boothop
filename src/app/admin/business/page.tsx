import { requireAdminPage } from '@/lib/auth/admin';
import AdminBusinessClient from './business-client';

export const dynamic = 'force-dynamic';

export default async function AdminBusinessPage() {
  await requireAdminPage();
  return <AdminBusinessClient />;
}

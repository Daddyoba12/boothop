import { requireAdminPage } from '@/lib/auth/admin';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await requireAdminPage();
  return <AdminDashboard serverSession={{ user: { email: session.email } }} />;
}

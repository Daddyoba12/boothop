import { requireAdminPage } from '@/lib/auth/admin';
import ComplianceClient from './compliance-client';

export const dynamic = 'force-dynamic';

export default async function AdminCompliancePage() {
  await requireAdminPage();
  return <ComplianceClient />;
}

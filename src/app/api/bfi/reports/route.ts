import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { generateReport, reportToCsv, type ReportPeriod } from '@/lib/bfi/reports';

export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url    = new URL(request.url);
  const period = (url.searchParams.get('period') ?? 'daily') as ReportPeriod;
  const format = url.searchParams.get('format') ?? 'json';

  const report = await generateReport(period);

  if (format === 'csv') {
    const csv = reportToCsv(report);
    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bfi-${period}-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}

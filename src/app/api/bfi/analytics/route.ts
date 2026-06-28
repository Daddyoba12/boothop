import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { getClickStats, getTodayClickCount, getTodayViewCount } from '@/lib/bfi/clicks';

export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = new URL(request.url).searchParams.get('period') ?? 'today';

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  if (period === 'week')  since.setDate(since.getDate() - 7);
  if (period === 'month') since.setDate(since.getDate() - 30);

  const [stats, todayClicks, todayViews] = await Promise.all([
    getClickStats(since),
    getTodayClickCount(),
    getTodayViewCount(),
  ]);

  return NextResponse.json({
    ...stats,
    todayClicks,
    todayViews,
    overallCtr: todayViews > 0 ? Math.round((todayClicks / todayViews) * 100) : 0,
  });
}

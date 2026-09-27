'use client';

import { useEffect, useState } from 'react';

type Status = 'checking' | 'ok' | 'down';

export default function StatusBadge() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch('/api/status', { signal: controller.signal, cache: 'no-store' })
      .then(res => res.json())
      .then(data => setStatus(data.ok ? 'ok' : 'down'))
      .catch(() => setStatus('down'))
      .finally(() => clearTimeout(timeout));

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const dotClass = status === 'down' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse';
  const textClass = status === 'down' ? 'text-red-600' : 'text-emerald-600';
  const label = status === 'checking' ? 'Checking status…' : status === 'ok' ? 'All systems operational' : 'Degraded performance';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-medium ${textClass}`}>{label}</span>
    </div>
  );
}

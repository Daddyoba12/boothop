import path from 'path';
import { stat } from 'fs/promises';
import Link from 'next/link';
import { ChevronRight, FileText, Image as ImageIcon, Download, Lock } from 'lucide-react';
import { requireAdminPage } from '@/lib/auth/admin';
import { ADMIN_DOWNLOADS } from '@/lib/admin-downloads';

export const dynamic = 'force-dynamic';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminDownloadsPage() {
  await requireAdminPage();

  const DOWNLOADS_DIR = path.join(process.cwd(), 'private', 'downloads');
  const entries = await Promise.all(
    ADMIN_DOWNLOADS.map(async (d) => {
      try {
        const s = await stat(path.join(DOWNLOADS_DIR, d.file));
        return { ...d, size: s.size, mtime: s.mtime, missing: false };
      } catch {
        return { ...d, size: 0, mtime: null, missing: true };
      }
    })
  );

  const isImage = (file: string) => /\.(png|jpe?g)$/i.test(file);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700">Downloads</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Private Documents</h1>
            <p className="text-sm text-slate-500 mt-1">
              Admin-only files — investor materials, internal docs, and anything that should never sit under <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/public</code>.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5 shrink-0">
            <Lock className="w-3.5 h-3.5" /> Admin session required
          </div>
        </div>

        {/* File list */}
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-sm">
          {entries.map((entry) => (
            <div key={entry.file} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isImage(entry.file) ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
              }`}>
                {isImage(entry.file) ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">{entry.label}</p>
                <p className="text-xs text-slate-400 truncate">
                  {entry.file}
                  {!entry.missing && <> · {formatSize(entry.size)}</>}
                  {entry.missing && <span className="text-red-500"> · file missing</span>}
                </p>
              </div>
              {!entry.missing && (
                <a
                  href={`/api/admin/downloads/${encodeURIComponent(entry.file)}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-6">
          To add a new document: drop the file into <code className="bg-slate-100 px-1 py-0.5 rounded">private/downloads/</code> and add an entry to <code className="bg-slate-100 px-1 py-0.5 rounded">src/lib/admin-downloads.ts</code>. Nothing in that folder is ever served publicly — files are only reachable through this authenticated route.
        </p>
      </div>
    </div>
  );
}

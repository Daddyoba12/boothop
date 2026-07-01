'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OpenFilePage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  useEffect(() => {
    if (!('launchQueue' in window)) return;

    (window as any).launchQueue.setConsumer(async (launchParams: any) => {
      if (!launchParams.files?.length) return;
      const file: File = await launchParams.files[0].getFile();
      setFileName(file.name);
      setFileType(file.type);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📎</div>
        {fileName ? (
          <>
            <p className="text-white font-semibold mb-1">{fileName}</p>
            <p className="text-white/40 text-sm mb-6">
              {fileType?.startsWith('image/') ? 'Share this as proof of delivery or package photo.' : 'Share this document with your delivery partner.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm"
            >
              Go to Dashboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-white font-semibold mb-1">Opening file…</p>
            <p className="text-white/40 text-sm mb-6">Use BootHop to share delivery documents and photos with your partner.</p>
            <Link href="/dashboard" className="text-orange-400 text-sm hover:underline">
              Go to Dashboard →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

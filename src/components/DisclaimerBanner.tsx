'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DisclaimerBanner() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">Important Information</p>
          <p>
            BootHop is a platform for sending <strong>personal effects, letters, and small parcels</strong>. 
            We are not responsible or obligated for items transported. Both parties must understand and comply with{' '}
            <Link href="/customs" className="underline font-semibold hover:text-yellow-900">
              customs regulations
            </Link>
            {' '}for international deliveries.
          </p>
        </div>
      </div>
    </div>
  );
}

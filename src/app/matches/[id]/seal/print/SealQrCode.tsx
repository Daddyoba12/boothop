'use client';

import { QRCodeSVG } from 'qrcode.react';

export function SealQrCode({ token }: { token: string }) {
  return (
    <QRCodeSVG
      value={token}
      size={180}
      level="H"
      includeMargin={false}
    />
  );
}

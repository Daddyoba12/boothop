const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomStr(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export function generateBarcode(prefix: 'SEND' | 'TRVL', matchId: string): string {
  const shortId = matchId.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}-${shortId}-${randomStr(6)}`;
}

export function validateBarcode(barcode: string): boolean {
  return /^(SEND|TRVL)-[A-Z0-9]{8}-[A-Z0-9]{6}$/.test(barcode);
}

export function parseBarcodeType(barcode: string): 'sender' | 'traveller' | null {
  if (barcode.startsWith('SEND-')) return 'sender';
  if (barcode.startsWith('TRVL-')) return 'traveller';
  return null;
}

export function maskPhone(phone: string): string {
  if (phone.length < 9) return phone;
  return `${phone.substring(0, 6)} ****** ${phone.substring(phone.length - 3)}`;
}

export function qrImageUrl(barcode: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(barcode)}`;
}

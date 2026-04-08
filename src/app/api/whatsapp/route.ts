import { NextResponse } from 'next/server';

// Number is server-only — never sent to the browser
const WA_NUMBER = process.env.WHATSAPP_NUMBER ?? '447506553755';
const WA_TEXT   = encodeURIComponent('Hi BootHop, I found you via your website and would like to get in touch.');

export async function GET() {
  return NextResponse.redirect(`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`, { status: 302 });
}

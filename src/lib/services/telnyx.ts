// eslint-disable-next-line @typescript-eslint/no-require-imports
const Telnyx = require('telnyx');

function getClient() {
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new Error('TELNYX_API_KEY not set');
  return Telnyx(key);
}

// ── SMS ───────────────────────────────────────────────────────────────────────

export async function sendSMS(phone: string, message: string): Promise<{ success: boolean; id?: string; cost?: number; error?: string }> {
  try {
    const telnyx = getClient();
    const result = await telnyx.messages.create({
      from: process.env.TELNYX_PHONE_NUMBER!,
      to:   phone,
      text: message,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/webhooks`,
      use_profile_webhooks: false,
    });

    console.log(`✅ SMS sent via Telnyx (£0.012): ${result.data.id}`);
    return { success: true, id: result.data.id, cost: 0.012 };
  } catch (error) {
    console.error('Telnyx SMS error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Voice call ────────────────────────────────────────────────────────────────
// Used for Priority-tier delivery alerts

export async function makeCall(phone: string, message: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const telnyx = getClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

    // Telnyx uses TeXML (same spec as Twilio TwiML)
    const result = await telnyx.calls.create({
      connection_id: process.env.TELNYX_CONNECTION_ID!,
      from:          process.env.TELNYX_PHONE_NUMBER!,
      to:            phone,
      // TeXML endpoint that returns the spoken message
      webhook_url:   `${appUrl}/api/telnyx/webhooks`,
      // Speak the message directly via TeXML
      texml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${message}</Say></Response>`,
    });

    console.log(`✅ Call initiated via Telnyx: ${result.data?.call_control_id}`);
    return { success: true, id: result.data?.call_control_id };
  } catch (error) {
    console.error('Telnyx call error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Phone verification (replaces OTP SMS) ────────────────────────────────────

export async function sendVerificationCode(phone: string): Promise<{ success: boolean; verificationId?: string; cost?: number; error?: string }> {
  try {
    const telnyx = getClient();
    const verification = await telnyx.verifications.create({
      phone_number:      phone,
      verify_profile_id: process.env.TELNYX_VERIFY_PROFILE_ID!,
      type:              'sms',
    });

    return { success: true, verificationId: verification.data.id, cost: 0.012 };
  } catch (error) {
    console.error('Telnyx sendVerificationCode error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyCode(phone: string, code: string): Promise<{ success: boolean; valid: boolean }> {
  try {
    const telnyx = getClient();
    const result = await telnyx.verifications.verify({ phone_number: phone, code });
    const valid  = result.data.response_code === 'accepted';
    return { success: true, valid };
  } catch (error) {
    console.error('Telnyx verifyCode error:', error);
    return { success: false, valid: false };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// WhatsApp Cloud API Webhook
//
// Handles two concerns:
//   1. Meta webhook verification (GET) — one-time setup check
//   2. Incoming message events (POST) — stores replies in Supabase
//
// Also exposes a poll endpoint (GET ?poll=1&id=xxx) used by the D818 pipeline
// to check if the operator replied POST or SKIP to an approval request.
//
// Register in Meta Developer Console:
//   Webhook URL    : https://boothop.com/api/webhook/whatsapp
//   Verify token   : set WHATSAPP_VERIFY_TOKEN in Vercel env vars
//   Subscriptions  : messages
//
// Required Supabase table (run once in Supabase SQL editor):
//   CREATE TABLE whatsapp_messages (
//     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     from_number TEXT        NOT NULL,
//     message_text TEXT       NOT NULL,
//     approval_id  TEXT,
//     received_at  TIMESTAMPTZ DEFAULT NOW(),
//     processed    BOOLEAN     DEFAULT FALSE
//   );
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// GET — two uses:
//   a) Meta verification handshake (hub.mode=subscribe)
//   b) Pipeline polling for a reply  (?poll=1&id=APPROVAL_ID)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  // --- Pipeline poll: ?poll=1&id=APPROVAL_ID ---
  if (p.get("poll") === "1") {
    const approvalId = p.get("id");
    if (!approvalId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Look for a POST or SKIP reply received after this approval was sent.
    // The pipeline embeds the ID in the message it sends; the operator just
    // replies POST or SKIP — we match against the most recent unprocessed
    // message from the approved sender that contains a decision keyword.
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("approval_id", approvalId)
      .eq("processed", false)
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[WhatsApp poll] Supabase error:", error);
      return NextResponse.json({ decision: null });
    }

    if (!data) {
      return NextResponse.json({ decision: null });
    }

    // Mark as processed so it is not returned twice
    await supabase
      .from("whatsapp_messages")
      .update({ processed: true })
      .eq("id", data.id);

    const text    = (data.message_text as string).toUpperCase();
    let decision: "post" | "skip" | null = null;
    if (text.includes("POST") || text.includes("✅")) decision = "post";
    if (text.includes("SKIP") || text.includes("⏭"))  decision = "skip";

    return NextResponse.json({ decision, message: data.message_text });
  }

  // --- Meta webhook verification handshake ---
  const mode      = p.get("hub.mode");
  const token     = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "boothop_whatsapp_2026";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp webhook] Verified by Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming WhatsApp messages from Meta
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  // Meta expects a 200 immediately — process async
  processIncoming(body).catch((e) =>
    console.error("[WhatsApp webhook] Processing error:", e)
  );

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Parse Meta message payload and store in Supabase
// ---------------------------------------------------------------------------

async function processIncoming(body: Record<string, unknown>) {
  const entries = (body?.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const changes = ((entry as Record<string, unknown>)?.changes as unknown[]) ?? [];

    for (const change of changes) {
      const value    = (change as Record<string, unknown>)?.value as Record<string, unknown>;
      const messages = (value?.messages as unknown[]) ?? [];

      for (const msg of messages) {
        const m    = msg as Record<string, unknown>;
        const type = m?.type as string;

        // Only handle text messages
        if (type !== "text") continue;

        const fromNumber  = (m?.from  as string) ?? "";
        const textPayload = (m?.text  as Record<string, unknown>)?.body as string ?? "";
        const msgId       = (m?.id    as string) ?? "";

        if (!fromNumber || !textPayload) continue;

        // Extract approval_id if operator included it in the reply
        // e.g. "POST abc12345" or just "POST" (we match by sender + recency)
        const idMatch   = textPayload.match(/\b([a-f0-9]{8})\b/i);
        const approvalId = idMatch ? idMatch[1] : await resolveApprovalId(fromNumber);

        console.log(
          `[WhatsApp] Message from ${fromNumber}: "${textPayload}" (approval: ${approvalId ?? "none"})`
        );

        const supabase = getSupabase();
        await supabase.from("whatsapp_messages").insert({
          from_number:  fromNumber,
          message_text: textPayload,
          approval_id:  approvalId ?? null,
          processed:    false,
        });

        // Acknowledge back to sender
        const replyText = buildAck(textPayload);
        if (replyText) {
          await sendWhatsAppMessage(fromNumber, replyText);
        }

        void msgId; // silence unused warning
      }
    }
  }
}

// If the operator didn't include the ID, find the most recent pending approval
async function resolveApprovalId(fromNumber: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    // Find the most recent message we sent to this number that hasn't been
    // replied to yet — stored as a pending row with no reply
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("approval_id")
      .is("approval_id", null)
      .eq("from_number", fromNumber)
      .eq("processed", false)
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.approval_id ?? null;
  } catch {
    return null;
  }
}

function buildAck(text: string): string | null {
  const upper = text.toUpperCase();
  if (upper.includes("POST") || upper.includes("✅"))
    return "Got it — posting now.";
  if (upper.includes("SKIP") || upper.includes("⏭"))
    return "Skipped. Video discarded.";
  return null;
}

async function sendWhatsAppMessage(to: string, text: string) {
  const token   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );
  } catch (e) {
    console.error("[WhatsApp ack] Send error:", e);
  }
}

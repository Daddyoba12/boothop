import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// WhatsApp Cloud API Webhook — registered with Meta at:
//   https://boothop.com/webhook/whatsapp
//
// GET  — Meta verification handshake (one-time setup)
// POST — Incoming messages from WhatsApp users
//
// Messages are stored in Supabase so the D818 pipeline can poll
// /api/webhook/whatsapp?poll=1&id=APPROVAL_ID for POST/SKIP decisions.
//
// Meta Developer Console setup:
//   Webhook URL   : https://boothop.com/webhook/whatsapp
//   Verify token  : boothop_whatsapp_2026
//   Subscriptions : messages
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// GET — Meta webhook verification
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const p         = req.nextUrl.searchParams;
  const mode      = p.get("hub.mode");
  const token     = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");

  if (mode === "subscribe" && token === "boothop_whatsapp_2026") {
    console.log("[WhatsApp webhook] Verified by Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming WhatsApp messages
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  // Respond 200 immediately — Meta requires a fast acknowledgement
  processIncoming(body).catch((e) =>
    console.error("[WhatsApp webhook] Processing error:", e)
  );

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Parse Meta message payload, store in Supabase
// ---------------------------------------------------------------------------

async function processIncoming(body: Record<string, unknown>) {
  const entries = (body?.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const changes = ((entry as Record<string, unknown>)?.changes as unknown[]) ?? [];

    for (const change of changes) {
      const value    = (change as Record<string, unknown>)?.value as Record<string, unknown>;
      const messages = (value?.messages as unknown[]) ?? [];

      for (const msg of messages) {
        const m         = msg as Record<string, unknown>;
        const type      = m?.type as string;

        if (type !== "text") continue;

        const senderNumber = (m?.from as string) ?? "";
        const messageText  = ((m?.text as Record<string, unknown>)?.body as string) ?? "";
        const timestamp    = (m?.timestamp as string) ?? "";

        if (!senderNumber || !messageText) continue;

        // Extract approval_id if operator included it (e.g. "POST abc12345")
        const idMatch    = messageText.match(/\b([a-f0-9]{8})\b/i);
        const approvalId = idMatch ? idMatch[1] : await resolveApprovalId(senderNumber);

        console.log(
          `[WhatsApp] from=${senderNumber} ts=${timestamp} text="${messageText}" approval=${approvalId ?? "none"}`
        );

        // Store in Supabase — D818 pipeline polls /api/webhook/whatsapp?poll=1&id=xxx
        const supabase = getSupabase();
        await supabase.from("whatsapp_messages").insert({
          from_number:  senderNumber,
          message_text: messageText,
          approval_id:  approvalId ?? null,
          processed:    false,
        });

        // handle_whatsapp_reply equivalent: send an acknowledgement back
        const ack = buildAck(messageText);
        if (ack) {
          await sendWhatsAppMessage(senderNumber, ack);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Resolve approval_id when operator didn't include it in the reply
// ---------------------------------------------------------------------------

async function resolveApprovalId(senderNumber: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("approval_id")
      .eq("from_number", senderNumber)
      .eq("processed", false)
      .not("approval_id", "is", null)
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.approval_id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Build acknowledgement text for POST / SKIP replies
// ---------------------------------------------------------------------------

function buildAck(text: string): string | null {
  const upper = text.toUpperCase();
  if (upper.includes("POST") || upper.includes("✅")) return "Got it — posting now.";
  if (upper.includes("SKIP") || upper.includes("⏭"))  return "Skipped. Video discarded.";
  return null;
}

// ---------------------------------------------------------------------------
// Send a WhatsApp message back to the sender
// ---------------------------------------------------------------------------

async function sendWhatsAppMessage(to: string, text: string) {
  const token   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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
    });
  } catch (e) {
    console.error("[WhatsApp ack] Send error:", e);
  }
}

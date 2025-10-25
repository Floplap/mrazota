// @ts-nocheck
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HmacSha256 } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import { z } from "https://esm.sh/zod@3.21.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const raw = await req.text();
    // optional signature
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('stripe-signature');
    if (WEBHOOK_SECRET && signature) {
      // verify HMAC SHA256
      const h = new HmacSha256(WEBHOOK_SECRET);
      h.update(raw);
      const digest = h.hex();
      if (!(digest === signature || `sha256=${digest}` === signature)) {
        return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401 });
      }
    }

    const Payload = z.object({ order_id: z.string().uuid(), status: z.string() });
    const parsed = Payload.safeParse(JSON.parse(raw));
    if (!parsed.success) return new Response(JSON.stringify({ error: 'invalid_payload', issues: parsed.error.format() }), { status: 400 });

    const { order_id, status } = parsed.data;

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: 'update_failed', detail: txt }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('payment_webhook error', err);
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(err) }), { status: 500 });
  }
});

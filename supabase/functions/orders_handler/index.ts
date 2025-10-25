// @ts-nocheck
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
// zod from esm.sh for lightweight validation
import { z } from "https://esm.sh/zod@3.21.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const body = await req.json();

    const ItemSchema = z.object({ product_id: z.string().uuid().optional(), quantity: z.number().int().min(1).optional().default(1), price: z.number().optional() });
    const PayloadSchema = z.object({ user_id: z.string().uuid().nullable().optional(), items: z.array(ItemSchema).optional().default([]), total: z.number().nonnegative() });

    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'invalid_payload', issues: parsed.error.format() }), { status: 400 });
    }

    const { user_id, items, total } = parsed.data;

    // Use the RPC create_order for atomic insert (safer transaction)
    const rpcResp = await fetch(`${SUPABASE_URL}/rpc/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ user_id, items, total })
    });

    if (!rpcResp.ok) {
      const text = await rpcResp.text();
      return new Response(JSON.stringify({ error: 'rpc_create_failed', detail: text }), { status: 500 });
    }

    // RPC returns a scalar (uuid) - PostgREST returns it as JSON
    const rpcBody = await rpcResp.json();
    const orderId = Array.isArray(rpcBody) ? rpcBody?.[0] : rpcBody;
    return new Response(JSON.stringify({ order_id: orderId }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('orders_handler error', err);
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(err) }), { status: 500 });
  }
});

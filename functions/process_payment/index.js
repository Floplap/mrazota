// process_payment Edge Function
// Creates a Stripe PaymentIntent and returns client_secret to the frontend.
// Required env: STRIPE_SECRET_KEY
// Optional env: DEFAULT_CURRENCY (e.g., 'usd')

export default async function (req, res) {
  try {
    const body = await req.json();
    const { cart = {}, orderId, userId, currency } = body || {};

    const stripeKey = process.env.STRIPE_SECRET_KEY || Deno?.env?.get?.('STRIPE_SECRET_KEY');
    if (!stripeKey) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in function env' });

    const total = Number(cart.total || 0);
    if (isNaN(total) || total <= 0) return res.status(400).json({ error: 'Invalid cart total' });

    const amount = Math.round(total * 100); // cents
    const cur = currency || process.env.DEFAULT_CURRENCY || 'usd';

    const params = new URLSearchParams();
    params.append('amount', String(amount));
    params.append('currency', cur);
    params.append('payment_method_types[]', 'card');
    if (orderId) params.append('metadata[order_id]', orderId);
    if (userId) params.append('metadata[user_id]', userId);

    const resp = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Stripe create error', data);
      return res.status(500).json({ error: 'Stripe error', details: data });
    }

    return res.json({ client_secret: data.client_secret, payment_intent_id: data.id, amount: data.amount, raw: data });
  } catch (err) {
    console.error('process_payment error', err);
    return res.status(500).json({ error: String(err) });
  }
}

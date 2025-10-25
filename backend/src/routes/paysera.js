// Consolidated Paysera routes
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Try to load a Supabase admin client helper if present
let supabaseAdmin = null;
try {
  supabaseAdmin = require('../lib/supabaseAdmin');
} catch (e) {
  // continue without admin client — logging will still happen
}

// Config from env
const PAYASERA_PROJECT_ID = process.env.PAYSERA_PROJECT_ID || process.env.PAYSERA_PROJECT_ID || '';
const PAYASERA_SECRET_KEY = process.env.PAYSERA_SECRET || process.env.PAYASERA_SECRET || '';
const PAYASERA_RETURN_URL = process.env.PAYSERA_RETURN_URL || '';

const adminClient = supabaseAdmin && supabaseAdmin.client ? supabaseAdmin.client : null;

// Helper: build Paysera payload and signature (template)
function buildPayseraUrl({ amount, description, orderId }) {
  const baseUrl = 'https://www.paysera.com/checkout'; // placeholder — replace with real paysera endpoint
  const payload = {
    projectId: PAYASERA_PROJECT_ID,
    orderId: orderId || `order-${Date.now()}`,
    amount: Number(amount) || 0,
    currency: 'EUR',
    description: description || 'Order payment',
    returnUrl: PAYASERA_RETURN_URL || undefined,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  let sign = '';
  if (PAYASERA_SECRET_KEY) {
    sign = crypto.createHmac('sha256', PAYASERA_SECRET_KEY).update(data).digest('hex');
  }

  const url = baseUrl + '?data=' + encodeURIComponent(data) + (sign ? '&sign=' + sign : '');
  return { url, payload };
}

// POST /create-payment
router.post('/create-payment', express.json(), async (req, res) => {
  const { amount, description, orderId } = req.body || {};
  if (!amount) return res.status(400).json({ error: 'amount required' });

  if (!PAYASERA_PROJECT_ID || !PAYASERA_SECRET_KEY) {
    const testUrl = `${PAYASERA_RETURN_URL || 'https://example.com'}/?payment=test&orderId=${orderId || 'test-' + Date.now()}`;
    console.warn('Paysera keys not configured — returning test URL', testUrl);
    return res.json({ url: testUrl, test: true });
  }

  const { url, payload } = buildPayseraUrl({ amount, description, orderId });
  // Persist order in DB with status 'pending' if adminClient is available
  if (adminClient) {
    try {
      const { data, error } = await adminClient.from('orders').insert([{ user_id: null, total: amount, status: 'pending' }]).select().single();
      if (!error && data) {
        return res.json({ url, payload, order: data });
      }
    } catch (err) {
      console.error('Failed to persist order', err);
    }
  }
  res.json({ url, payload });
});

// POST /webhook — Paysera will POST payment status here
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  // Try JSON/body parsing or form data
  const raw = req.body.toString();
  let parsed = null;

  // If body contains data=... (base64) and sign, handle that format
  try {
    const qs = require('querystring');
    parsed = qs.parse(raw);
  } catch (e) {
    // ignore
  }

  const data = parsed && parsed.data ? parsed.data : (req.body && req.body.data) || null;
  const sign = parsed && parsed.sign ? parsed.sign : (req.body && req.body.sign) || null;

  if (!data && !raw) {
    console.warn('Paysera webhook: no data');
    return res.status(400).send('no data');
  }

  if (PAYASERA_SECRET_KEY && sign && data) {
    const calc = crypto.createHmac('sha256', PAYASERA_SECRET_KEY).update(data).digest('hex');
    if (calc !== sign) {
      console.warn('Paysera webhook signature mismatch');
      return res.status(400).send('invalid signature');
    }
  }

  try {
    const payload = data ? JSON.parse(Buffer.from(data, 'base64').toString('utf8')) : JSON.parse(raw);
    console.log('Paysera webhook payload', payload);
    if (adminClient && payload.orderId) {
      try {
        await adminClient.from('orders').update({ status: 'paid' }).eq('id', payload.orderId);
      } catch (e) {
        console.error('Failed to update order status', e);
      }
    }
  } catch (err) {
    console.error('Failed to parse webhook payload', err);
  }

  res.status(200).send('OK');
});

module.exports = router;

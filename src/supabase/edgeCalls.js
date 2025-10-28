const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL);
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY);

async function callEdge(name, body) {
  if (!BASE) throw new Error('Missing SUPABASE URL');
  const res = await fetch(`${BASE}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ANON ? { Authorization: `Bearer ${ANON}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${name} failed: ${res.status} ${t}`);
  }
  return res.json();
}

export function aiModerate(content) {
  return callEdge('ai_moderate', { content });
}

export function aiAssistant(prompt, opts = {}) {
  return callEdge('ai_assistant', { prompt, options: opts });
}

export function processPayment(cart, userId) {
  return callEdge('process_payment', { cart, userId });
}

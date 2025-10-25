// Debug endpoint to return latest rows from profiles, posts and orders.
// Prefer using the privileged admin client (service role). If missing, attempt
// a limited read using the anon key (if provided) and otherwise return a
// helpful JSON message explaining how to set env vars.
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;
try {
  supabaseAdmin = require('../lib/supabaseAdmin');
} catch (e) {
  // ignore - we'll try fallback below
}

router.get('/latest', async (req, res) => {
  // If privileged admin client exists, use it.
  if (supabaseAdmin && supabaseAdmin.client) {
    try {
      const profiles = await supabaseAdmin.client.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
      const posts = await supabaseAdmin.client.from('posts').select('*').order('created_at', { ascending: false }).limit(5);
      const orders = await supabaseAdmin.client.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
      return res.json({ profiles: profiles.data || [], posts: posts.data || [], orders: orders.data || [] });
    } catch (e) {
      console.error('Debug endpoint admin query error', e);
      return res.status(500).json({ error: 'Admin query failed', detail: e.message || String(e) });
    }
  }

  // No admin client — try anon-key fallback if possible (limited by RLS).
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // Request a minimal public projection to avoid leaking sensitive fields.
      const profiles = await anon.from('profiles').select('id,display_name,avatar_url,created_at').order('created_at', { ascending: false }).limit(5);
      const posts = await anon.from('posts').select('id,title,author,created_at').order('created_at', { ascending: false }).limit(5);
      return res.status(200).json({
        warning: 'Privileged Supabase admin key not found. Returning limited results using anon key (may be restricted by RLS).',
        profiles: profiles.data || [],
        posts: posts.data || []
      });
    } catch (e) {
      console.error('Debug endpoint anon query error', e);
      // Fall through to helpful message below.
    }
  }

  // Helpful guidance when nothing can be done programmatically.
  return res.status(500).json({
    error: 'Supabase admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY in backend env to enable full debug output.',
    how_to_fix: [
      "Create a file at backend/.env (or set environment variables in your host)",
      "Add SUPABASE_URL=https://<your-project>.supabase.co",
      "Add SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>",
      "Restart the backend (e.g. restart the node process)",
      "After that, re-run GET /api/debug/latest"
    ],
    note: "If you don't want to use the service role key, set SUPABASE_ANON_KEY to attempt a limited read (may be blocked by RLS)."
  });
});

module.exports = router;

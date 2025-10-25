// Simple messenger REST endpoints (scaffold)
const express = require('express');
const router = express.Router();

// GET /messenger/conversations - list simple conversation heads (placeholder)
router.get('/conversations', async (req, res) => {
  // Placeholder implementation: return empty list or sample
  res.json({ data: [], message: 'Conversations scaffold — implement realtime via Socket.IO or Supabase Realtime' });
});

// POST /messenger/send - send simple message (server will persist if configured)
router.post('/send', express.json(), async (req, res) => {
  const { from_user, to_user, body } = req.body || {};
  if (!from_user || !to_user || !body) return res.status(400).json({ error: 'from_user, to_user and body required' });

  // Persist to messages table if supabase admin exists
  try {
    const supabaseAdmin = require('../lib/supabaseAdmin');
    if (supabaseAdmin && supabaseAdmin.client) {
      const insert = await supabaseAdmin.client.from('messages').insert([{ from_user, to_user, body }]);
      if (insert.error) {
        console.warn('Failed to persist message:', insert.error);
      }
    }
  } catch (e) {
    // ignore missing admin client
  }

  // Note: a real realtime messenger should use Socket.IO / Supabase Realtime
  res.json({ ok: true, message: 'Message accepted (scaffold)' });
});

module.exports = router;

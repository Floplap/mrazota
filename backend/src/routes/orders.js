const express = require('express')
const router = express.Router()
const { adminClient } = require('../lib/supabaseAdmin')

function isAdmin(req) {
  const secret = process.env.BACKEND_ADMIN_SECRET || ''
  if (!secret) return false
  return req.headers['x-admin-secret'] === secret
}

// GET /api/orders - admin only
router.get('/', async (req, res) => {
  if (!isAdmin(req) || !adminClient) return res.status(403).json({ error: 'admin required' })
  try {
    const { data, error } = await adminClient.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('orders list err', err)
    res.status(500).json({ error: 'DB error' })
  }
})

// PATCH /api/orders/:id - update status
router.patch('/:id', async (req, res) => {
  if (!isAdmin(req) || !adminClient) return res.status(403).json({ error: 'admin required' })
  const id = req.params.id
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'status required' })
  try {
    const { data, error } = await adminClient.from('orders').update({ status }).eq('id', id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('orders update err', err)
    res.status(500).json({ error: 'DB error' })
  }
})

module.exports = router

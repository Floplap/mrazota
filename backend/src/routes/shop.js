const express = require('express');
const router = express.Router();
const { adminClient } = require('../lib/supabaseAdmin')

// fallback categories if no DB
const fallbackCategories = ['merch', 'souvenirs', 'gifts', 'accessories', 'other'];
let productsMemory = [];

// Helper: admin check (simple shared secret) — set BACKEND_ADMIN_SECRET in backend env for admin endpoints
function isAdmin(req) {
  const secret = process.env.BACKEND_ADMIN_SECRET || ''
  if (!secret) return false
  return req.headers['x-admin-secret'] === secret
}

// GET /categories
router.get('/categories', async (req, res) => {
  if (adminClient) {
    try {
      const { data, error } = await adminClient.from('products').select('category')
      if (error) throw error
      const cats = Array.from(new Set((data || []).map(p => p.category).filter(Boolean)))
      return res.json(cats.length ? cats : fallbackCategories)
    } catch (err) {
      console.error('shop categories err', err)
      return res.json(fallbackCategories)
    }
  }
  return res.json(fallbackCategories)
})

// GET /products
router.get('/products', async (req, res) => {
  if (adminClient) {
    try {
      const { data, error } = await adminClient.from('products').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('shop products err', err)
      return res.status(500).json({ error: 'DB error' })
    }
  }
  // fallback to in-memory
  res.json(productsMemory)
})

// POST /products — create product (admin only)
router.post('/products', async (req, res) => {
  if (!isAdmin(req) && !adminClient) return res.status(403).json({ error: 'Admin required' })
  const { title, description, price, category, image_url, stock } = req.body
  if (adminClient) {
    try {
      const { data, error } = await adminClient.from('products').insert([{ title, description, price, category, image_url, stock }]).select().single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('shop create err', err)
      return res.status(500).json({ error: 'DB error' })
    }
  }
  const p = { id: productsMemory.length + 1, title, description, price, category, image_url, stock }
  productsMemory.push(p)
  res.json(p)
})

module.exports = router;

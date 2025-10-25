import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminProducts() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0.00')
  const [category, setCategory] = useState('merch')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const uploadAndCreate = async () => {
    setLoading(true)
    setMessage('')
    try {
      let image_url = ''
      if (file) {
        const ext = file.name.split('.').pop()
        const name = `${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('media').upload(name, file, { upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('media').getPublicUrl(name)
        image_url = data.publicUrl
      }

      // call backend to create product
      const apiUrl = (import.meta.env.VITE_BACKEND_API_URL || '') + '/api/shop/products'
      const adminSecret = import.meta.env.VITE_BACKEND_ADMIN_SECRET || ''
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}) },
        body: JSON.stringify({ title, description, price, category, image_url })
      })
      if (!resp.ok) throw new Error('Create product failed: ' + (await resp.text()))
      setTitle('')
      setDescription('')
      setPrice('0.00')
      setCategory('merch')
      setFile(null)
      setMessage('Product created')
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page container">
      <h1 className="text-2xl font-semibold mb-4">Admin — Create Product</h1>

      <div className="max-w-xl bg-white p-6 rounded shadow">
        <label className="block mb-2">Title</label>
        <input className="w-full border p-2 rounded mb-3" value={title} onChange={e => setTitle(e.target.value)} />

        <label className="block mb-2">Description</label>
        <textarea className="w-full border p-2 rounded mb-3" value={description} onChange={e => setDescription(e.target.value)} />

        <label className="block mb-2">Price (€)</label>
        <input className="w-full border p-2 rounded mb-3" value={price} onChange={e => setPrice(e.target.value)} />

        <label className="block mb-2">Category</label>
        <input className="w-full border p-2 rounded mb-3" value={category} onChange={e => setCategory(e.target.value)} />

        <label className="block mb-2">Image</label>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mb-3" />

        <div className="flex gap-2">
          <button className="rounded bg-indigo-600 text-white px-4 py-2" onClick={uploadAndCreate} disabled={loading}>Create</button>
        </div>

        {message && <div className="mt-3 text-sm">{message}</div>}
      </div>
    </div>
  )
}

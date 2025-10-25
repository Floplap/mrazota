import React, { useEffect, useState } from 'react'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const adminSecret = import.meta.env.VITE_BACKEND_ADMIN_SECRET || ''
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || ''

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const resp = await fetch(apiBase + '/api/orders', { headers: { ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}) } })
      if (!resp.ok) throw new Error('Failed')
      const data = await resp.json()
      setOrders(data || [])
    } catch (err) {
      console.error(err)
      alert('Failed to load orders (check BACKEND_ADMIN_SECRET and BACKEND_API_URL)')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (id, status) => {
    try {
      const resp = await fetch(apiBase + '/api/orders/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}) }, body: JSON.stringify({ status }) })
      if (!resp.ok) throw new Error('update failed')
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert('Update failed')
    }
  }

  return (
    <div className="page container">
      <h1 className="text-2xl font-semibold mb-4">Admin — Orders</h1>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {orders.length === 0 ? <div>No orders</div> : orders.map(o => (
            <div key={o.id} className="bg-white p-4 rounded shadow-sm flex justify-between items-center">
              <div>
                <div className="font-medium">Order {o.id}</div>
                <div className="text-sm text-slate-500">Total: €{o.total}</div>
                <div className="text-sm text-slate-500">Status: {o.status}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => updateStatus(o.id, 'paid')}>Mark paid</button>
                <button className="px-3 py-1 rounded bg-yellow-500 text-white" onClick={() => updateStatus(o.id, 'processing')}>Processing</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React from 'react'

export default function ShoppingCart({ cart }) {
  const { items, total, remove, updateQty, clear } = cart
  const checkout = async () => {
    if (!items || items.length === 0) return alert('Cart is empty')
    try {
      const apiUrl = (import.meta.env.VITE_BACKEND_API_URL || '') + '/api/paysera/create-payment'
      const order = { items, amount: total, description: `Order with ${items.length} items` }
      const resp = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Payment init failed')
      const url = data.url
      if (!url) throw new Error('No payment url returned')
      // Redirect user to payment URL
      window.location.href = url
    } catch (err) {
      console.error('Checkout error', err)
      alert(err.message || 'Checkout failed')
    }
  }

  return (
    <div className="bg-white rounded p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Корзина</h3>
      {items.length === 0 ? <div className="text-sm text-slate-500">Пусто</div> : (
        <div>
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-slate-500">€{it.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={it.qty} onChange={e => updateQty(it.id, Math.max(1, Number(e.target.value || 1)))} className="w-16 border p-1 rounded" />
                <button className="text-red-500" onClick={() => remove(it.id)}>Remove</button>
              </div>
            </div>
          ))}

          <div className="mt-3 font-semibold">Total: €{total.toFixed(2)}</div>
          <div className="mt-3 flex gap-2">
            <button className="rounded bg-indigo-600 text-white px-3 py-1" onClick={checkout}>Checkout</button>
            <button className="rounded border px-3 py-1" onClick={clear}>Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}

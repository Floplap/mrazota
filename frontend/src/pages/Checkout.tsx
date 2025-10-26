import React, { useEffect, useState } from 'react'
import { FUNCTIONS_URL, supabase } from '../lib/supabaseClient'

export default function Checkout({ onDone }: { onDone?: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setItems(cart)

    // try to get current user
    (async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUserId(data?.user?.id || null)
      } catch {
        setUserId(null)
      }
    })()
  }, [])

  const placeOrder = async () => {
    try {
      const total = items.reduce((s: number, it: any) => s + (Number(it.price) || 0) * (it.quantity || 1), 0)
      const payload = { user_id: userId, items, total }
      const resp = await fetch(`${FUNCTIONS_URL}/orders_handler`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (resp.ok) {
        setStatus('Order placed: ' + data.order_id)
        localStorage.removeItem('cart')
        onDone && onDone()
      } else {
        setStatus('Error: ' + JSON.stringify(data))
      }
    } catch (err) {
      setStatus('Error: ' + String(err))
    }
  }

  return (
    <div>
      <h2>Checkout</h2>
      <div>Items: {items.length}</div>
      <div>Total: {items.reduce((s: number, it: any) => s + (Number(it.price)||0)*(it.quantity||1), 0).toFixed(2)}</div>
      <div style={{ marginTop: 8 }}>
        <button onClick={placeOrder}>Place Order</button>
      </div>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  )
}

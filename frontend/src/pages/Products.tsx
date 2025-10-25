import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Products({ onAddToCart }: { onAddToCart?: () => void }) {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true })
      if (data) setProducts(data as any[])
    }
    load()
  }, [])

  const add = (p: any) => {
    const existing = JSON.parse(localStorage.getItem('cart') || '[]')
    existing.push({ product_id: p.id, quantity: 1, price: Number(p.price) })
    localStorage.setItem('cart', JSON.stringify(existing))
    onAddToCart && onAddToCart()
  }

  const cart = JSON.parse(localStorage.getItem('cart') || '[]')

  return (
    <div>
      <h2>Products</h2>
      {products.map((p) => (
        <div key={p.id} style={{ borderBottom: '1px solid #eee', padding: 8 }}>
          <div>{p.title} — ${p.price}</div>
          <div style={{ fontSize: 12 }}>{p.description}</div>
          <button onClick={() => add(p)}>Add to cart</button>
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <strong>Cart: {cart.length} items</strong>
      </div>
    </div>
  )
}

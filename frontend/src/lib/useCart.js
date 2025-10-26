import { useState, useEffect } from 'react'

const CART_KEY = 'mrazota_cart'

export function useCart() {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)) } catch { }
  }, [items])

  function add(item) {
    setItems(prev => {
      const found = prev.find(p => p.id === item.id)
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function remove(id) {
    setItems(prev => prev.filter(p => p.id !== id))
  }

  function updateQty(id, qty) {
    setItems(prev => prev.map(p => p.id === id ? { ...p, qty } : p))
  }

  function clear() { setItems([]) }

  const total = items.reduce((s, i) => s + (Number(i.price || 0) * (i.qty || 1)), 0)

  return { items, add, remove, updateQty, clear, total }
}

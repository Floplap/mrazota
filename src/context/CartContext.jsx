import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { const raw = typeof window !== 'undefined' ? localStorage.getItem('mrazota_cart') : null; return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('mrazota_cart', JSON.stringify(items)); } catch (e) {}
  }, [items]);

  function addItem(item) {
    setItems((cur) => {
      const found = cur.find((i) => i.id === item.id);
      if (found) return cur.map((i) => i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i);
      return [...cur, { ...item, qty: item.qty || 1 }];
    });
  }

  function removeItem(id) {
    setItems((cur) => cur.filter((i) => i.id !== id));
  }

  function updateQty(id, qty) {
    setItems((cur) => cur.map((i) => i.id === id ? { ...i, qty } : i));
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

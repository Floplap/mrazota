import React from 'react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';

export default function Cart() {
  const { items, updateQty, removeItem, total } = useCart();

  if (!items || items.length === 0) return (
    <div>
      <div>Корзина пуста</div>
      <Link href="/store"><a>Перейти в магазин</a></Link>
    </div>
  );

  return (
    <div>
      <h3>Корзина</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(it => (
          <li key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{it.title}</div>
              <div style={{ color: '#666' }}>{it.description}</div>
            </div>
            <div>
              <input type="number" min={1} value={it.qty} onChange={(e)=> updateQty(it.id, Math.max(1, Number(e.target.value || 1)))} style={{ width: 60 }} />
            </div>
            <div style={{ width: 100, textAlign: 'right' }}>{(Number(it.price) || 0) * (it.qty || 1)} ₽</div>
            <div><button onClick={() => removeItem(it.id)}>Удалить</button></div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><strong>Итого: {total} ₽</strong></div>
        <div>
          <Link href="/checkout"><a><button>Оформить заказ</button></a></Link>
        </div>
      </div>
    </div>
  );
}

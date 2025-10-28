import React, { useEffect, useState } from 'react';
import { listItems } from './store.api';
import { useAuth } from '../../hooks/useAuth';

export default function StoreCatalog() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const data = await listItems().catch(console.error);
      setItems(data || []);
    })();
  }, []);

  return (
    <div>
      <h3>Магазин</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {items.map(it => (
          <div key={it.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <h4>{it.title}</h4>
            <div>{it.description}</div>
            <div style={{ marginTop: 8 }}><strong>{it.price} ₽</strong></div>
            <button style={{ marginTop: 8 }}>Добавить в корзину</button>
          </div>
        ))}
      </div>
    </div>
  );
}

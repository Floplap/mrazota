import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { createOrderAndInitPayment, confirmOrderPaid } from '../modules/store/checkout.api';

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  async function handleCheckout() {
    if (!user) return alert('Войдите чтобы продолжить покупку');
    setLoading(true);
    try {
      const { order: createdOrder, payment } = await createOrderAndInitPayment(user.id, items, total);
      setOrder(createdOrder);

      // For demo: our Edge function returns client_secret placeholder; in production use Stripe SDK to confirm payment.
      // Here we simulate immediate success and mark order as paid.
      await confirmOrderPaid(createdOrder.id, payment?.payment_intent_id || null);
      clear();
      alert('Оплата подтверждена — заказ оформлен');
    } catch (err) {
      console.error(err);
      alert('Ошибка оформления заказа: ' + (err.message || String(err)));
    } finally { setLoading(false); }
  }

  if (!items || items.length === 0) return <div>Корзина пуста — добавьте товары в <a href="/store">магазине</a></div>;

  return (
    <div>
      <h2>Оформление заказа</h2>
      <div>
        <ul>
          {items.map(it => <li key={it.id}>{it.title} — {it.qty} × {it.price} ₽</li>)}
        </ul>
        <div style={{ marginTop: 12 }}><strong>Итого: {total} ₽</strong></div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={handleCheckout} disabled={loading}>{loading ? 'Пожалуйста подождите...' : 'Оплатить'}</button>
      </div>

      {order && (
        <div style={{ marginTop: 16 }}>
          <h4>Заказ #{order.id}</h4>
          <div>Статус: {order.status}</div>
        </div>
      )}
    </div>
  );
}

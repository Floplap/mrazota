import supabase from '../../supabase/supabaseClient';
import { processPayment } from '../../supabase/edgeCalls';

export async function createOrderAndInitPayment(userId, items, total) {
  // 1) create order record with status 'pending'
  const { data: order, error } = await supabase.from('orders').insert([{ user_id: userId, items, total, status: 'pending', created_at: new Date().toISOString() }]).select().single();
  if (error) throw error;

  // 2) call Edge Function to initiate payment (returns client_secret or payment intent placeholder)
  // processPayment is a wrapper over Edge Function; keep body minimal
  const res = await processPayment({ cart: { items, total }, orderId: order.id }, userId).catch((e) => { throw e; });

  return { order, payment: res };
}

export async function confirmOrderPaid(orderId, paymentIntentId = null) {
  const { data, error } = await supabase.from('orders').update({ status: 'paid', payment_intent_id: paymentIntentId }).eq('id', orderId).select().single();
  if (error) throw error;
  return data;
}

import supabase from '../../supabase/supabaseClient';

export async function listItems(limit = 50) {
  const { data, error } = await supabase.from('store_items').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function createOrder(userId, items, total) {
  const { data, error } = await supabase.from('orders').insert([{ user_id: userId, items, total, status: 'pending' }]).select().single();
  if (error) throw error;
  return data;
}

export async function getOrder(orderId) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) throw error;
  return data;
}

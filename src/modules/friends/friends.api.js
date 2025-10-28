import supabase from '../../supabase/supabaseClient';

export async function sendFriendRequest(userId, friendId) {
  const { data, error } = await supabase.from('friends').insert([{ user_id: userId, friend_id: friendId, status: 'pending' }]);
  if (error) throw error;
  return data;
}

export async function acceptFriendRequest(requestId) {
  const { data, error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId).select().single();
  if (error) throw error;
  return data;
}

export async function listFriends(userId) {
  const { data, error } = await supabase.from('friends').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`).filter('status','eq','accepted');
  if (error) throw error;
  return data;
}

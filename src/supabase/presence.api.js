import supabase from './supabaseClient';

export async function setPresence(userId, status = 'online') {
  if (!userId) return null;
  // call RPC to set presence atomically
  try {
    const { error } = await supabase.rpc('set_user_presence', { p_user_id: userId, p_status: status });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('setPresence error', err);
    // fallback to upsert
    try {
      const { error: upErr } = await supabase.from('presence').upsert([{ user_id: userId, status, last_seen: new Date().toISOString() }]);
      if (upErr) throw upErr;
      return true;
    } catch (e) {
      console.error('setPresence upsert fallback error', e);
      return false;
    }
  }
}

export async function getPresenceFor(userIds = []) {
  if (!userIds || userIds.length === 0) return [];
  const { data, error } = await supabase.from('presence').select('*').in('user_id', userIds);
  if (error) throw error;
  return data;
}

export function subscribeToPresence(callback) {
  const channel = supabase
    .channel('presence_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return channel;
}

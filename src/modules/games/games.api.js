import supabase from '../../supabase/supabaseClient';

export async function createGameRoom({ hostId, name = 'Game room', metadata = {} } = {}) {
  const { data, error } = await supabase.from('game_rooms').insert([{ host_id: hostId, players: json_build_array(hostId), state: metadata }]).select().single();
  // Note: json_build_array is Postgres function; some clients may not accept it here. If error, use array in JS.
  if (error) {
    // fallback to simple insert
    const { data: d2, error: e2 } = await supabase.from('game_rooms').insert([{ host_id: hostId, players: [hostId], state: metadata }]).select().single();
    if (e2) throw e2;
    return d2;
  }
  return data;
}

export async function joinGameRoom(roomId, userId) {
  // atomically append user to players jsonb array
  // We'll fetch room, modify players locally and update
  const { data: room, error } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
  if (error) throw error;
  const players = room.players || [];
  if (!players.includes(userId)) players.push(userId);
  const { data, error: uErr } = await supabase.from('game_rooms').update({ players }).eq('id', roomId).select().single();
  if (uErr) throw uErr;
  return data;
}

export async function sendGameState(roomId, state) {
  const { data, error } = await supabase.from('game_rooms').update({ state }).eq('id', roomId).select().single();
  if (error) throw error;
  return data;
}

export async function recordResult(gameId, userId, score) {
  const { data, error } = await supabase.rpc('record_game_result', { p_game_id: gameId, p_user_id: userId, p_score: score });
  if (error) throw error;
  return data;
}

export async function listTopLeaderboard(limit = 20) {
  const { data, error } = await supabase.from('leaderboard').select('user_id,score').order('score', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

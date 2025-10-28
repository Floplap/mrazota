import supabase, { storage } from '../../supabase/supabaseClient';

export async function listTopTracks(limit = 20) {
  const { data, error } = await supabase.from('music_tracks').select('*').order('plays', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function uploadTrack(file, { title, duration, metadata = {} } = {}) {
  const id = crypto?.randomUUID?.() || (Date.now().toString());
  const path = `tracks/${id}-${file.name}`;
  await storage().upload(path, file);
  const publicUrl = storage().getPublicUrl(path);
  const { error } = await supabase.from('music_tracks').insert([
    { id, title, storage_path: path, duration, metadata }
  ]);
  if (error) throw error;
  return { id, url: publicUrl };
}

export async function likeTrack(trackId, userId) {
  const { error } = await supabase.from('track_likes').insert([{ track_id: trackId, user_id: userId }]);
  if (error) {
    // if duplicate, ignore
    if (error.message && error.message.includes('duplicate key')) return;
    throw error;
  }
  // increment likes_count (could be done by trigger or RPC)
  await supabase.from('music_tracks').update({ likes_count: supabase.raw('coalesce(likes_count,0) + 1') }).eq('id', trackId);
}

export async function addComment(trackId, authorId, content) {
  const { data, error } = await supabase.from('track_comments').insert([{ track_id: trackId, author_id: authorId, content }]);
  if (error) throw error;
  return data;
}

export async function incrementPlay(trackId) {
  const { error } = await supabase.rpc('increment_play_count', { p_track_id: trackId });
  if (error) console.error('incrementPlay error', error);
}

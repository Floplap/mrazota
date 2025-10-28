import supabase from './supabaseClient';

// Simple auth helpers. For production, prefer server-side profile creation or DB trigger on auth.user_created.

export async function signUp({ email, password, username }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const user = data.user || null;
  if (!user) return null;

  // create profile record with initial XP (client-side fallback)
  const { error: pErr } = await supabase.from('profiles').upsert([
    {
      id: user.id,
      username: username || email.split('@')[0],
      xp: 100,
      level_id: 1,
      created_at: new Date().toISOString(),
    },
  ]);
  if (pErr) console.error('profile create error', pErr);
  return user;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

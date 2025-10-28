import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabase/supabaseClient';

// Hook: useXP(userId)
// returns { xp, level, loading, addXP }
export function useXP(userId) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setXp(0);
      setLevel(null);
      return;
    }
    setLoading(true);
    try {
      const { data: profile, error } = await supabase.from('profiles').select('xp, level_id').eq('id', userId).single();
      if (error) throw error;
      setXp(profile.xp || 0);
      if (profile.level_id) {
        const { data: lvl } = await supabase.from('levels').select('*').eq('id', profile.level_id).single();
        setLevel(lvl || null);
      }
    } catch (err) {
      console.error('useXP fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return undefined;
    const channel = supabase
      .channel(`profiles:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
        if (payload.new) {
          setXp(payload.new.xp ?? 0);
          // level_id change handled by refetch or payload
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [fetch, userId]);

  async function addXP(amount, reason = 'action') {
    if (!userId) throw new Error('No userId');
    // Prefer an RPC on the DB to handle atomic increment + level-up logic.
    try {
      const { data, error } = await supabase.rpc('increment_profile_xp', { p_user_id: userId, p_amount: amount });
      if (error) {
        console.error('addXP rpc error', error);
      } else {
        // RPC may return object with fields; rely on realtime to update UI
        return data;
      }
    } catch (err) {
      console.error('addXP error', err);
    }
  }

  return { xp, level, loading, addXP };
}

import { useEffect, useState } from 'react';
import { listFriends } from '../modules/friends/friends.api';
import supabase from '../supabase/supabaseClient';

export function useFriends(userId) {
  const [friends, setFriends] = useState([]);
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      const data = await listFriends(userId).catch(console.error);
      if (mounted) setFriends(data || []);
    })();

    const channel = supabase
      .channel('friends_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, (payload) => {
        // refresh list or update incremental
        (async () => {
          const d = await listFriends(userId).catch(console.error);
          if (mounted) setFriends(d || []);
        })();
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [userId]);

  return friends;
}

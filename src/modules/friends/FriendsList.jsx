import React, { useEffect, useState } from 'react';
import { listFriends } from './friends.api';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../supabase/supabaseClient';

// Improved FriendsList with presence display (online/playing/offline)
export default function FriendsList() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    (async () => {
      try {
        const f = await listFriends(user.id);
        if (!mounted) return;
        setFriends(f || []);

        // fetch presence for friend ids
        const friendIds = f.map((r) => (r.user_id === user.id ? r.friend_id : r.user_id));
        if (friendIds.length) {
          const { data: pres } = await supabase.from('presence').select('*').in('user_id', friendIds);
          const map = {};
          (pres || []).forEach((p) => { map[p.user_id] = p; });
          setPresenceMap(map);
        }
      } catch (e) { console.error(e); }
    })();

    // subscribe to presence changes globally and update map
    const channel = supabase
      .channel('presence_sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (payload) => {
        const p = payload.new;
        if (!p) return;
        setPresenceMap((m) => ({ ...m, [p.user_id]: p }));
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [user]);

  if (!user) return <div>Войдите, чтобы увидеть друзей</div>;

  return (
    <div>
      <h3>Друзья</h3>
      {friends.length === 0 ? <div>Нет друзей</div> : (
        <ul>
          {friends.map((f) => {
            const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
            const pres = presenceMap[friendId];
            const status = pres ? pres.status : 'offline';
            return (
              <li key={f.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: status === 'online' ? '#10b981' : status === 'playing' ? '#f59e0b' : '#9ca3af' }} />
                <div>{friendId} <small style={{ color: '#666' }}>— {status}</small></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import supabase from '../../supabase/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { createGameRoom } from './games.api';

export default function GameLobby({ onJoin } = {}) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('game_rooms').select('*').order('created_at', { ascending: false }).limit(50);
      if (mounted) setRooms(data || []);
    })();

    const channel = supabase
      .channel('game_rooms_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, (payload) => {
        // refresh simple list
        (async () => {
          const { data } = await supabase.from('game_rooms').select('*').order('created_at', { ascending: false }).limit(50);
          setRooms(data || []);
        })();
      })
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(channel); } catch (e) {} };
  }, []);

  async function handleCreate() {
    if (!user) return alert('Войдите чтобы создать комнату');
    setCreating(true);
    try {
      const room = await createGameRoom({ hostId: user.id, name: `${user.email || 'host'}'s room` });
      onJoin?.(room.id);
    } catch (err) { console.error(err); alert('Ошибка создания комнаты'); }
    finally { setCreating(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={handleCreate} disabled={creating}>{creating ? 'Создаём...' : 'Создать комнату'}</button>
      </div>

      <div>
        <h4>Лобби комнат</h4>
        {rooms.length === 0 ? <div>Нет комнат</div> : (
          <ul>
            {rooms.map(r => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <strong>{r.name || r.id}</strong>
                <div>Игроков: {(r.players || []).length}</div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => onJoin?.(r.id)}>Присоединиться</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

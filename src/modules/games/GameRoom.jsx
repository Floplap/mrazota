import React, { useEffect, useState, useRef } from 'react';
import supabase from '../../supabase/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { joinGameRoom, sendGameState, recordResult } from './games.api';

export default function GameRoom({ roomId }) {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [state, setState] = useState(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stateRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
      if (error) return console.error(error);
      if (mounted) { setRoom(data); setState(data.state || {}); }
    })();

    const channel = supabase
      .channel(`game_room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new) {
          setRoom(payload.new);
          setState(payload.new.state || {});
        }
      })
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(channel); } catch (e) {} };
  }, [roomId]);

  async function handleJoin() {
    if (!user) return alert('Войдите чтобы присоединиться');
    try {
      await joinGameRoom(roomId, user.id);
    } catch (err) { console.error(err); alert('Ошибка присоединения'); }
  }

  async function handleStart() {
    setPlaying(true);
    // example: local game loop that increases score
    const interval = setInterval(() => {
      setScore((s) => s + Math.floor(Math.random() * 5));
    }, 1000);
    stateRef.current = interval;
  }

  async function handleStopAndSubmit() {
    setPlaying(false);
    if (stateRef.current) clearInterval(stateRef.current);
    try {
      const res = await recordResult(roomId, user.id, score);
      alert(`Результат отправлен. XP +${res.awarded_xp}`);
    } catch (err) { console.error(err); alert('Ошибка сохранения результата'); }
  }

  async function pushState(newState) {
    try {
      await sendGameState(roomId, newState);
    } catch (err) { console.error(err); }
  }

  if (!room) return <div>Загрузка комнаты...</div>;

  return (
    <div>
      <h3>Комната: {room.name || room.id}</h3>
      <div>Host: {room.host_id}</div>
      <div>Players: {(room.players || []).join(', ')}</div>

      <div style={{ marginTop: 12 }}>
        {!room.players?.includes(user?.id) ? (
          <button onClick={handleJoin}>Присоединиться</button>
        ) : (
          <div>
            {!playing ? <button onClick={handleStart}>Начать игру (тест)</button> : <button onClick={handleStopAndSubmit}>Остановить и отправить результат</button>}
            <div style={{ marginTop: 8 }}>Score: {score}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Game state (shared)</h4>
        <pre style={{ background: '#fafafa', padding: 8 }}>{JSON.stringify(state, null, 2)}</pre>
        <button onClick={() => { const ns = { ping: Math.random() }; setState(ns); pushState(ns); }}>Send ping</button>
      </div>
    </div>
  );
}

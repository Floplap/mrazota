import React, { useState, useEffect, useRef } from 'react';
import supabase from '../../supabase/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function ChatRoom({ roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, room_id, sender_id, content, attachment_url, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) return console.error(error);
      if (mounted) setMessages(data || []);
    })();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!text?.trim()) return;
    try {
      const { error } = await supabase.from('messages').insert([
        { room_id: roomId, sender_id: user.id, content: text, created_at: new Date().toISOString() },
      ]);
      if (error) console.error(error);
      setText('');
    } catch (err) {
      console.error('sendMessage', err);
    }
  }

  return (
    <div className="chat-room">
      <div className="messages" style={{ maxHeight: '60vh', overflow: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.sender_id === user?.id ? 'mine' : ''}`}>
            <div className="meta">
              <strong>{m.sender_id}</strong>
              <time>{new Date(m.created_at).toLocaleTimeString()}</time>
            </div>
            <div className="body">
              {m.content}
              {m.attachment_url && <img src={m.attachment_url} alt="att" style={{ maxWidth: '300px' }} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="composer" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..."
          style={{ flex: 1 }}
        />
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
}

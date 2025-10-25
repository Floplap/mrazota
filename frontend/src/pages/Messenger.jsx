import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io();

export default function Messenger() {
  const [room, setRoom] = useState('global');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesRef = useRef([]);

  useEffect(() => {
    socket.emit('join-room', { room });
    socket.on('chat-message', (m) => {
      messagesRef.current = [...messagesRef.current, m];
      setMessages([...messagesRef.current]);
    });
    return () => { socket.off('chat-message'); };
  }, [room]);

  const send = () => {
    if (!text) return;
    socket.emit('chat-message', { room, message: text });
    setText('');
  };

  return (
    <div className="p-6 page messenger-page">
      <h1 className="text-2xl font-bold">Messenger</h1>
      <p className="mt-2">This is a placeholder page. Realtime chat will be implemented via Socket.IO or Supabase Realtime.</p>
      <div className="mt-4">
        <input className="border p-1" value={room} onChange={e => setRoom(e.target.value)} />
        <button className="ml-2 px-3 py-1 bg-gray-200" onClick={() => socket.emit('join-room', { room })}>Join</button>
      </div>
      <div className="messages mt-4" style={{height:200,overflow:'auto'}}>
        {messages.map((m,i) => <div key={i} className="py-1">{m.id}: {m.message}</div>)}
      </div>
      <div className="mt-3">
        <input className="border p-1" value={text} onChange={e=>setText(e.target.value)} />
        <button className="ml-2 px-3 py-1 bg-blue-600 text-white" onClick={send}>Send</button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import ChatRoom from '../modules/chat/ChatRoom';

export default function ChatPage() {
  const [roomId, setRoomId] = useState('');

  return (
    <div>
      <h2>Чат</h2>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Room id" value={roomId} onChange={(e)=>setRoomId(e.target.value)} />
        <button onClick={()=>setRoomId(roomId)}>Подключиться</button>
      </div>
      {roomId ? <ChatRoom roomId={roomId} /> : <div>Введите room id чтобы подключиться к комнате (например uuid комнаты)</div>}
    </div>
  );
}

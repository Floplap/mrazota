import React, { useState } from 'react';
import GameLobby from '../modules/games/GameLobby';
import GameRoom from '../modules/games/GameRoom';

export default function GamesPage() {
  const [joinedRoom, setJoinedRoom] = useState('');

  return (
    <div>
      <h2>Игры</h2>
      {!joinedRoom ? (
        <GameLobby onJoin={(roomId) => setJoinedRoom(roomId)} />
      ) : (
        <GameRoom roomId={joinedRoom} />
      )}
    </div>
  );
}

import React from 'react';

export default function Games() {
  return (
    <div className="p-6 page games-page">
      <h1 className="text-2xl font-bold">Игры / Games</h1>
      <p className="mt-4">TicTacToe and simple single-player games will be implemented here.</p>
      <p className="mt-2">Здесь будут одиночные игры и возможность играть онлайн с друзьями (realtime через Socket.IO).</p>
      <div className="mt-6">(Game UI placeholder)</div>
    </div>
  );
}

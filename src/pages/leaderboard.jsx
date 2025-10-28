import React from 'react';
import Leaderboard from '../modules/games/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div>
      <h2>Топ игроков</h2>
      <Leaderboard limit={50} />
    </div>
  );
}

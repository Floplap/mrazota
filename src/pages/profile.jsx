import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useXP } from '../hooks/useXP';
import LevelProgress from '../components/gamification/LevelProgress';

export default function ProfilePage() {
  const { user } = useAuth();
  const { xp, level, loading } = useXP(user?.id);

  if (!user) return <div>Пожалуйста, войдите</div>;

  return (
    <div>
      <h2>Профиль</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div><strong>{user.email}</strong></div>
          <div>XP: {loading ? '...' : xp}</div>
        </div>
        <div style={{ flex: 1 }}>
          <LevelProgress xp={xp} level={level} />
        </div>
      </div>
    </div>
  );
}

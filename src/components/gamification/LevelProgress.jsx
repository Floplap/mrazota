import React from 'react';

export default function LevelProgress({ xp = 0, level = null }) {
  if (!level) return null;
  const required = level.xp_required || 100;
  const percent = Math.min(100, Math.round((xp / required) * 100));
  return (
    <div className="level-progress" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong>Уровень {level.level_number}</strong>
        <span>{xp} / {required} XP</span>
      </div>
      <div style={{ height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#3b82f6)' }} />
      </div>
    </div>
  );
}

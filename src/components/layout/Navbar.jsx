import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <div style={{ fontWeight: 700 }}>MRAZOTA</div>
      <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
        <a href="/">Home</a>
        <a href="/music">Музыка</a>
        <a href="/forum">Форум</a>
        <a href="/chat">Чат</a>
        <a href="/games">Игры</a>
        <a href="/friends">Друзья</a>
        <a href="/store">Магазин</a>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={toggle}>{theme === 'light' ? '🌞' : '🌙'}</button>
        {user ? <a href="/profile">{user.email}</a> : <a href="/signin">Войти</a>}
      </div>
    </nav>
  );
}

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>MRAZOTA</h1>
      <p>Welcome to the MRAZOTA demo frontend.</p>
      <ul>
        <li><Link href="/music">Музыка</Link></li>
        <li><Link href="/forum">Форум</Link></li>
        <li><Link href="/chat">Чат</Link></li>
        <li><Link href="/games">Игры (заглушка)</Link></li>
        <li><Link href="/friends">Друзья</Link></li>
        <li><Link href="/store">Магазин</Link></li>
        <li><Link href="/profile">Профиль</Link></li>
      </ul>
    </div>
  );
}

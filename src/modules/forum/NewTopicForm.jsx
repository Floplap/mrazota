import React, { useState } from 'react';
import { createTopic } from './forum.api';
import { useAuth } from '../../hooks/useAuth';

export default function NewTopicForm({ onCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await createTopic({ title, content, authorId: user.id });
      setTitle(''); setContent('');
      onCreated?.(res);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ошибка');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Заголовок темы" />
      <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Текст темы" rows={6} />
      <button type="submit" disabled={loading || !title || !content}>{loading ? 'Создаём...' : 'Создать тему'}</button>
    </form>
  );
}

import React, { useEffect, useState } from 'react';
import NewTopicForm from '../modules/forum/NewTopicForm';
import { listTopics } from '../modules/forum/forum.api';

export default function ForumPage() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await listTopics();
        setTopics(t || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div>
      <h2>Форум</h2>
      <section style={{ marginBottom: 20 }}>
        <h3>Создать тему</h3>
        <NewTopicForm onCreated={(res) => { console.log('topic created', res); setTopics((s)=> [res.topic, ...s]); }} />
      </section>

      <section>
        <h3>Темы</h3>
        {topics.length === 0 ? <div>Пусто</div> : (
          <ul>
            {topics.map(t => (
              <li key={t.id}><strong>{t.title}</strong> — {t.created_at}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

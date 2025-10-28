import supabase from '../../supabase/supabaseClient';
import { aiModerate } from '../../supabase/edgeCalls';

export async function createTopic({ title, content, authorId, tags = [] }) {
  // run AI moderation first
  const verdict = await aiModerate(`${title}\n\n${content}`).catch((e) => { console.error('aiModerate error', e); return { verdict: 'allow' }; });
  if (verdict && verdict.verdict === 'block') {
    throw new Error('Сообщение заблокировано модератором');
  }

  const { data: topic, error: tErr } = await supabase.from('forum_topics').insert([{ title, author_id: authorId, tags }]).select().single();
  if (tErr) throw tErr;

  const { data: post, error: pErr } = await supabase.from('forum_posts').insert([{ topic_id: topic.id, author_id: authorId, content, moderated: false }]).select().single();
  if (pErr) throw pErr;

  // update last_post_at
  await supabase.from('forum_topics').update({ last_post_at: post.created_at }).eq('id', topic.id);

  return { topic, post };
}

export async function listTopics(limit = 30) {
  const { data, error } = await supabase.from('forum_topics').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

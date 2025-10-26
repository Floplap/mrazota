import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data } = await supabase.from('posts').select('*').order('inserted_at', { ascending: false })
      if (mounted && data) setPosts(data as any[])
    }
    load()

    // naive realtime: subscribe to inserts
    const channel = supabase.channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((p) => [payload.new, ...p])
      })
      .subscribe()

    return () => {
      mounted = false
      try { supabase.removeChannel(channel) } catch { }
    }
  }, [])

  return (
    <div>
      <h2>Feed</h2>
      {posts.map((p) => (
        <div key={p.id} style={{ borderBottom: '1px solid #ddd', padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>{p.inserted_at}</div>
          <div>{p.content}</div>
        </div>
      ))}
    </div>
  )
}

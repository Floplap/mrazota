import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Media() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
        if (error) throw error
        setPosts(data || [])
      } catch (err) {
        console.error('Error fetching posts', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const upload = async () => {
    if (!file) return alert('Choose a file first')
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('media').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      // create public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
      const mediaUrl = urlData.publicUrl
      // insert post
      const { error: insertError } = await supabase.from('posts').insert([{ content, media_url: mediaUrl }])
      if (insertError) throw insertError
      alert('Uploaded')
      // refresh
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
      setPosts(data || [])
      setFile(null)
      setContent('')
    } catch (err) {
      console.error('Upload error', err)
      alert(err.message || 'Upload failed')
    }
  }

  return (
    <div className="page media-page container">
      <h1 className="text-2xl font-semibold mb-4">Медиа: песни, видео, фото, посты</h1>

      <div className="mb-6">
        <textarea className="w-full border p-2 rounded mb-2" placeholder="Текст поста" value={content} onChange={e => setContent(e.target.value)} />
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <div className="mt-2">
          <button className="rounded bg-indigo-600 text-white px-4 py-2" onClick={upload}>Upload</button>
        </div>
      </div>

      {loading ? <div>Загрузка...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded p-4 shadow-sm">
              <p className="mb-2">{p.content}</p>
              {p.media_url && <img src={p.media_url} alt="media" className="max-w-full rounded" />}
              <div className="mt-2 text-sm text-slate-500">Likes: {p.likes}</div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-slate-500">Пользователи смогут лайкать, комментировать и делиться — сейчас реализована базовая загрузка в Supabase Storage (bucket `media`).</p>
    </div>
  )
}

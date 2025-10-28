import React, { useEffect, useRef, useState } from 'react';
import { incrementPlay } from './music.api';
import supabase, { storage } from '../../supabase/supabaseClient';

export default function MusicPlayer({ track }) {
  const audioRef = useRef(null);
  const [url, setUrl] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!track) return;
    // get public url
    try {
      const u = storage.getPublicUrl(track.storage_path);
      setUrl(u);
    } catch (e) {
      console.error('getPublicUrl', e);
    }
  }, [track]);

  function handlePlay() {
    if (!audioRef.current) return;
    audioRef.current.play();
    setPlaying(true);
    // increment play count
    incrementPlay(track.id).catch(console.error);
  }
  function handlePause() {
    audioRef.current.pause();
    setPlaying(false);
  }

  if (!track) return <div>Нет трека</div>;

  return (
    <div className="music-player" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <div style={{ marginBottom: 8 }}><strong>{track.title}</strong></div>
      <audio ref={audioRef} src={url} controls onPlay={handlePlay} onPause={handlePause} style={{ width: '100%' }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => (playing ? handlePause() : handlePlay())}>{playing ? 'Пауза' : 'Проиграть'}</button>
      </div>
    </div>
  );
}

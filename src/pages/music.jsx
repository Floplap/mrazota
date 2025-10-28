import React, { useEffect, useState } from 'react';
import { listTopTracks } from '../modules/music/music.api';
import MusicPlayer from '../modules/music/MusicPlayer';

export default function MusicPage() {
  const [tracks, setTracks] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await listTopTracks();
        if (mounted) setTracks(t || []);
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h2>Музыка — топ треков</h2>
      {tracks.length === 0 && <div>Пусто</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {tracks.map((tr) => (
          <div key={tr.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
            <MusicPlayer track={tr} />
          </div>
        ))}
      </div>
    </div>
  );
}

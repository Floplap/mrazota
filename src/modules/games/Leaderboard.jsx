import React, { useEffect, useState } from 'react';
import { listTopLeaderboard } from './games.api';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../supabase/supabaseClient';

export default function Leaderboard({ limit = 50 }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTopLeaderboard(limit);
        if (!mounted) return;
        setRows(data || []);
        if (user) {
          // compute rank by counting higher scores
          const { data: rankRes } = await supabase.rpc('get_user_rank', { p_user_id: user.id });
          if (rankRes && mounted) setMyRank(rankRes.rank || null);
        }
      } catch (e) { console.error(e); }
    })();

    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        (async () => {
          try {
            const data = await listTopLeaderboard(limit);
            if (mounted) setRows(data || []);
            if (user) {
              const { data: rankRes } = await supabase.rpc('get_user_rank', { p_user_id: user.id });
              if (mounted && rankRes) setMyRank(rankRes.rank || null);
            }
          } catch (e) { console.error(e); }
        })();
      })
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(channel); } catch (e) {} };
  }, [user, limit]);

  return (
    <div>
      <h3>Лидерборд</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>#</th>
            <th>User</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.user_id} style={{ background: user?.id === r.user_id ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
              <td style={{ padding: '8px 6px' }}>{idx + 1}</td>
              <td style={{ padding: '8px 6px' }}>{r.user_id}</td>
              <td style={{ padding: '8px 6px' }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {user && (
        <div style={{ marginTop: 12 }}>Ваш ранг: {myRank ?? '—'}</div>
      )}
    </div>
  );
}

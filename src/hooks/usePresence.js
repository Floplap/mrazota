import { useEffect, useRef } from 'react';
import supabase from '../supabase/supabaseClient';
import { setPresence } from '../supabase/presence.api';

// usePresence handles setting presence on mount and heartbeat, and unsubscribing on unmount
export function usePresence(userId, opts = { status: 'online', heartbeatMs: 15000 }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    // set presence immediately
    setPresence(userId, opts.status).catch(console.error);

    // heartbeat
    intervalRef.current = setInterval(() => {
      if (!mounted) return;
      setPresence(userId, opts.status).catch(console.error);
    }, opts.heartbeatMs || 15000);

    // on unload set offline (best-effort)
    const handleBeforeUnload = () => {
      try { supabase.rpc('set_user_presence', { p_user_id: userId, p_status: 'offline' }); } catch (e) { }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
      try { supabase.rpc('set_user_presence', { p_user_id: userId, p_status: 'offline' }); } catch (e) { }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, opts.status, opts.heartbeatMs]);
}

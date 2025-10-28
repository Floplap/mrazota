import { useEffect, useState, useContext, createContext } from 'react';
import supabase from '../supabase/supabaseClient';

const AuthContext = createContext({ user: null, session: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setUser(data?.session?.user || null);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, session }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

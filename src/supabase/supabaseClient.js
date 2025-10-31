import { createRequire } from 'module';

// NOTE: we avoid importing '@supabase/supabase-js' at top-level because
// in test environments there may be local copies or broken installs that
// throw on import. Instead we attempt to require it at runtime only when
// a real client is needed.

let createClient;
try {
  const require = createRequire(import.meta.url);
  // attempt to load the createClient function; if it fails we'll fall back to mock
  // (this keeps the module safe to import in environments without a working supabase-js package)
  // eslint-disable-next-line global-require
  const supa = require('@supabase/supabase-js');
  createClient = supa.createClient || supa.default?.createClient;
} catch (err) {
  // failed to require supabase-js — tests and mock-mode will still work
  createClient = undefined;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
const FORCE_MOCK = process.env.FORCE_MOCK === 'true' || false;

let supabase;

if (!FORCE_MOCK && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
} else {
  // Minimal mock implementation to keep UI and legacy pages working without real keys.
  // Only implements the methods the app calls: auth.getUser, functions.invoke, from(...).select/insert/update/delete, storage helpers, channel stubs.
  const noop = async () => ({ data: null, error: null });

  const mockFrom = (table) => ({
    select: async () => ({ data: [], error: null }),
    insert: async (rows) => ({ data: rows, error: null }),
    update: async (v) => ({ data: v, error: null }),
    delete: async () => ({ data: null, error: null }),
    order: () => mockFrom(table),
    eq: () => mockFrom(table),
    single: async () => ({ data: null, error: null }),
    limit: () => mockFrom(table),
  });

  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: null, unsubscribe: () => {} }),
    },
    functions: {
      invoke: async (name, opts = {}) => {
        // deterministic mocks for known functions
        if (name === 'grant-xp') {
          return { data: { newAchievements: [] }, error: null };
        }
        return { data: { echoed: { name, opts } }, error: null };
      },
    },
    from: mockFrom,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: `/mock/public/${path}` } }),
        download: async () => ({ data: null, error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
  };

  // warn developer once when running in mock mode
  // eslint-disable-next-line no-console
  console.warn('[supabaseClient] Running in MOCK mode (FORCE_MOCK=true or missing keys). Supabase calls will be stubbed.');
}

export const storage = {
  fromPublic: () => supabase.storage.from('public'),
  async upload(path, file, options = {}) {
    const { data, error } = await supabase.storage.from('public').upload(path, file, options);
    if (error) throw error;
    return data;
  },
  getPublicUrl(path) {
    return supabase.storage.from('public').getPublicUrl(path).data.publicUrl;
  },
  async download(path) {
    const { data, error } = await supabase.storage.from('public').download(path);
    if (error) throw error;
    return data;
  },
};

export default supabase;

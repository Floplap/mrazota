import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Do not throw here — allow dev to set env. Console warning instead.
  // In server/edge code use SERVICE_ROLE key stored securely.
  // eslint-disable-next-line no-console
  console.warn('[supabaseClient] Missing SUPABASE URL or ANON KEY. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

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

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Export a `client` property (used across routes). When service role is available
// we initialize a privileged client. If not, `client` will be null and routes
// can attempt a limited anon-key fallback or surface helpful guidance.
let client = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  console.log('Supabase admin client initialized')
} else {
  console.warn('Supabase admin client not initialized. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env to enable DB-backed admin endpoints.')
}

module.exports = { client }

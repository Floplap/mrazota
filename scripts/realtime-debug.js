// Minimal script to insert a post (debug realtime)
// Usage: set env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then: node scripts/realtime-debug.js
const fetch = globalThis.fetch || require('node-fetch')

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function main(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    body: JSON.stringify([{ content: 'realtime-debug ' + new Date().toISOString() }])
  })
  console.log('status', res.status)
  console.log(await res.text())
}

main().catch((e)=>{ console.error(e); process.exit(1) })

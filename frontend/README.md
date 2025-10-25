# Frontend (Vite + React)

Quick start

1. Copy environment variables (use Vite prefix `VITE_`):

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key_here
VITE_FUNCTIONS_URL=https://<project>.functions.supabase.co

2. Install and run

```bash
cd frontend
npm install
npm run dev
```

3. Visit http://localhost:5173

Notes
- This is a minimal skeleton. The checkout/cart is in-memory and needs wiring for production.
- Make sure your Supabase anon key is used in the frontend; use service role only on server-side functions.

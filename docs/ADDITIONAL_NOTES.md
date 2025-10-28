Additional setup notes for MRAZOTA frontend

Files created by the assistant in this session:

- `db/migrations/001_init_tables.sql` - initial tables and RPCs
- `src/supabase/supabaseClient.js`
- `src/supabase/auth.js`
- `src/supabase/edgeCalls.js`
- `src/hooks/useAuth.js`
- `src/hooks/useXP.js`
- `src/components/ui/ToastProvider.jsx`
- `src/components/gamification/LevelProgress.jsx`
- `src/components/ThemeProvider.jsx`
- `src/components/layout/Navbar.jsx` (fixed import)
- `src/modules/chat/ChatRoom.jsx`
- `src/modules/music/music.api.js`
- `src/modules/music/MusicPlayer.jsx`
- `src/modules/forum/forum.api.js`
- `src/modules/forum/NewTopicForm.jsx`
- `src/modules/friends/friends.api.js`
- `src/modules/friends/FriendsList.jsx`
- `src/modules/store/store.api.js`
- `src/modules/store/StoreCatalog.jsx`
- `functions/ai_moderate/index.js`
- `functions/process_payment/index.js`
- `functions/ai_assistant/index.js`

Quick deploy notes

1) Migrations
- Use the Supabase CLI or psql to apply `db/migrations/001_init_tables.sql` to your database. This creates tables and two RPCs used by the frontend (`increment_profile_xp`, `increment_play_count`).

2) Edge Functions
- Deploy the functions in `functions/` with the Supabase CLI (`supabase functions deploy <name>`).
- Keep secrets (Stripe key, AI keys, SUPABASE_SERVICE_ROLE_KEY) on server and only reference them from functions via environment variables.

3) Frontend env
- Create `.env.local` (Next) or `.env` (Vite) with:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

4) Notes & TODOs
- The RPCs assume a `levels` table and that levels contain xp thresholds. You may want to seed `levels` rows.
- Add RLS policies for each table to restrict access (work I can generate next).
- The Edge Function templates are placeholders; replace with real AI/Stripe logic.

Next suggested automated steps I can perform now (pick one or I'll start with #1):
- Generate SQL for RLS policies and example triggers.
- Seed `levels` table with initial level thresholds.
- Wire components into a simple Next.js `pages/_app.jsx` and example pages for Music/Forum/Chat/Store.
- Add small unit tests or a smoke test harness.

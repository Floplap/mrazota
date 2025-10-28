# MRAZOTA Frontend - quick start

This README contains a minimal quick-start for the frontend pieces created by the assistant.

Prerequisites
- Node 18+
- A Supabase project with the following environment variables set in `.env.local` (Next.js) or `.env` (Vite):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY should never be used in frontend code
```

Install dependencies (example for Next.js):

```powershell
npm install
npm install @supabase/supabase-js uuid
npm run dev
```

Files added in `src/`:
- `supabase/supabaseClient.js` - Supabase client + storage helpers
- `supabase/auth.js` - simple auth helpers (signup/signin/signout)
- `supabase/edgeCalls.js` - wrappers to call Edge Functions (ai_moderate, process_payment, ai_assistant)
- `hooks/useAuth.js` - Auth context provider and hook
- `hooks/useXP.js` - useXP hook (relies on `increment_profile_xp` RPC in DB)
- `modules/chat/ChatRoom.jsx` - simple realtime chat component
- `components/gamification/LevelProgress.jsx` - UI for level progress bar
- `components/ui/ToastProvider.jsx` - simple toast provider

Next steps and recommendations
- Add the SQL migrations for tables and RPCs (profiles, messages, music_tracks, levels, xp_transactions, increment_profile_xp, etc.).
- Configure RLS policies and DB triggers for consistent behavior.
- Move sensitive operations (profile creation with service role, payments, AI keys) into Edge Functions or server-only code.
- Wire components into your pages and style them (Tailwind or custom CSS).

If you want, I can now:
- generate SQL migrations for the recommended tables and RPCs,
- wire these components into a Next.js `pages/` or `app/` layout in this repo,
- or run tests/build locally and fix issues.

Tell me which of these you'd like me to do next and I'll continue automatically.

Recent automated changes made by the assistant:

- Added presence support (DB migration `db/migrations/004_presence.sql`, RPC `set_user_presence`).
- Added `src/supabase/presence.api.js` and `src/hooks/usePresence.js` to manage presence heartbeats.
- Enhanced `FriendsList.jsx` to display online/playing/offline statuses and subscribe to presence updates.
- Added `src/hooks/useFriends.js` hook for reactive friends lists.

Next recommended actions:

1) Run migrations 001..004 against your Supabase DB (see notes in `docs/ADDITIONAL_NOTES.md`).
2) Deploy Edge Functions and set secrets.
3) Start the Next.js dev server and test presence by opening multiple browsers and logging in as different users.

If you'd like, I will now automatically:
- A: generate Games & Leaderboard scaffolding, or
- B: add unit tests and GitHub Actions CI for migrations and frontend build, or
- C: stop and wait for you to run migrations and review files.

Say which option you want (default: A).

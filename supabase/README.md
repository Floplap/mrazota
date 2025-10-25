# Supabase integration for this repository

Structure
- `supabase/migrations/` - SQL migrations split by logical steps
- `supabase/functions/` - Edge Functions (Deno)

Quick start (local)
1. Install supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Start local: `supabase start`
4. Apply migrations: `supabase db push` or use psql with `psql $DATABASE_URL -f supabase/migrations/001_extensions_and_tables.sql` then subsequent files in order.

Deploy functions
1. Build/prepare functions (Deno functions use source as-is)
2. `supabase functions deploy orders_handler --project-ref <ref>`
3. `supabase functions deploy payment_webhook --project-ref <ref>`

Notes
- Replace placeholders in `supabase/.env.example` with real values and store secrets in CI as GitHub Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `WEBHOOK_SECRET`.

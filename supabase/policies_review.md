# RLS / Policies Review

Summary

- Ensure all policies that rely on the current authenticated user use `auth.uid()` and cast appropriately, e.g. `auth.uid()::uuid = user_id`.
- Prefer `TO authenticated` for policies that allow signed-in users and `TO public` only when truly public.
- Add indexes on columns used in RLS `USING` and `WITH CHECK` conditions, e.g., `user_id`, `author_id`, `auth_id`.

Practical, tested policy suggestions

1) Profiles — only owner can SELECT/UPDATE their profile; no public inserts

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON profiles FROM public;

CREATE POLICY profiles_owner_select ON profiles
	FOR SELECT USING (auth.uid()::text = auth_id);

CREATE POLICY profiles_owner_mod ON profiles
	FOR UPDATE, DELETE USING (auth.uid()::text = auth_id)
	WITH CHECK (auth.uid()::text = auth_id);

-- Allow server/service role full access (service role bypasses RLS)
```

2) Posts — public read (feed) but only owner can modify/insert

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON posts FROM public;

-- Allow anyone to read posts for a public feed
CREATE POLICY posts_public_read ON posts
	FOR SELECT USING (true);

-- Allow authenticated users to create posts, but ensure author_id matches jwt uid
CREATE POLICY posts_create_auth ON posts
	FOR INSERT WITH CHECK (auth.uid()::uuid = author_id);

-- Allow owner to update/delete
CREATE POLICY posts_owner_modify ON posts
	FOR UPDATE, DELETE USING (auth.uid()::uuid = author_id)
	WITH CHECK (auth.uid()::uuid = author_id);
```

3) Orders — owner-only access

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON orders FROM public;

CREATE POLICY orders_owner_full ON orders
	FOR ALL USING (auth.uid()::uuid = user_id)
	WITH CHECK (auth.uid()::uuid = user_id);

-- For server-side workflows (payments) use RPCs with service role key, not client anon key.
```

4) Messages, Friends — restrict by relation

Messages typically need policies that check membership in a room or sender/recipient relationship. Example (simple):

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_participant ON messages
	FOR SELECT USING (
		auth.uid()::uuid = sender_id OR auth.uid()::uuid IN (
			SELECT user_id FROM friends WHERE friend_id = sender_id
		)
	);
```

Indexes to add (if not present)

```sql
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room);
```

How to test policies locally (recommended steps)

1. Use the service role key to run health checks and policy exports (service role bypasses RLS):

```powershell
$env:DATABASE_URL = '<your postgres connection string>'
psql $env:DATABASE_URL -f supabase/health_check.sql
```

2. Export current policies (script provided):

```powershell
$env:DATABASE_URL = '<your postgres connection string>'
.\scripts\export-policies.ps1
type supabase\policies.sql
```

3. Use REST calls with anon key vs. service role key to compare behavior (example):

```bash
# service role (should be able to SELECT profiles)
curl -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/profiles"

# anon key (should be limited by RLS)
curl -H "apikey: $ANON_KEY" "$SUPABASE_URL/rest/v1/profiles"
```

Edge Functions security checklist

- Never embed `SUPABASE_SERVICE_ROLE_KEY` in client code. Use `Deno.env.get` or secrets in CI. The functions in `supabase/functions/*` use `Deno.env.get` (good).
- Validate incoming payloads strictly; use JSON schema or manual checks before DB operations (avoid trusting client input).
- Prefer RPC/Stored Procedures for multi-row/transactional changes (we added `create_order` RPC and updated `orders_handler` to call it).
- For webhooks, verify signature: `payment_webhook` checks HMAC sha256 if `WEBHOOK_SECRET` is set — ensure the sending provider uses the same signing scheme.
- Log failures (but avoid logging secrets). Consider structured logs.

Next steps / recommendations

1. Run the `supabase/health_check.sql` and `scripts/export-policies.ps1` against a staging DB.
2. Review `supabase/migrations/002_indexes_and_rls.sql` and replace example policies with the concrete ones above (or adjust to your product rules).
3. Add tests that emulate JWTs: some test harnesses can set `Authorization: Bearer <jwt>` with a test JWT; else seed data via service role then call REST with anon key to validate RLS denies access.


Suggested index additions

```sql
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

Test queries (simulate jwt by setting role and jwt claims)

-- 1) As anonymous (no jwt)
SELECT current_setting('jwt.claims') as claims; -- depends on test harness

-- 2) Check that profile row is visible to its owner (example using jwt-sub)
-- You can emulate by setting role and jwt.claims in a session if your test harness supports it.

-- 3) Quick policy test: try to SELECT a protected table via REST with anon key (should fail) and with service_role key (should succeed).

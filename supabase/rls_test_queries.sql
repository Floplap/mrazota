-- rls_test_queries.sql
-- Quick manual queries to validate RLS policies. Run via psql with a service role and as an anon user to compare.

-- 1) As service role (should succeed):
-- psql "${DATABASE_URL}" -c "SELECT * FROM posts LIMIT 5;"

-- 2) As anon (simulate by using anon key with REST or a session without jwt):
-- curl -H "apikey: <ANON_KEY>" "<SUPABASE_URL>/rest/v1/posts?select=*"

-- 3) Test profile owner access (replace <user_jwt> with a user's JWT)
-- curl -H "Authorization: Bearer <user_jwt>" "<SUPABASE_URL>/rest/v1/profiles?select=*&id=eq.<PROFILE_ID>"

-- 4) Example SQL to check policies on a table:
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as with_check
FROM pg_policy
WHERE polrelid = 'posts'::regclass;

-- 5) Recommendation: use the service role to run the health check:
-- psql "${DATABASE_URL}" -f supabase/health_check.sql

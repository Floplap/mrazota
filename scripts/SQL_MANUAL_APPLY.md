Manual apply: how to paste `infra/supabase_schema.sql` into Supabase Console
=======================================================================

If CI can't be used immediately, apply the SQL manually via the Supabase web Console:

1) Open the SQL file in this repo:
   - `infra/supabase_schema.sql`

2) Open Supabase Console: https://app.supabase.com → select your project → SQL Editor

3) Create a new query and paste all contents of `infra/supabase_schema.sql` into the editor.

4) Click Run. Wait until the script finishes.

5) Verify the schema was created (run this query in the SQL editor):

```sql
select tablename from pg_catalog.pg_tables
where tablename in ('profiles','posts','products','messages','friends','orders');
```

6) If any errors occur during the SQL run, copy the error message and the failing SQL snippet and
   paste them here; I'll help interpret and provide fixes.

Notes
- The schema includes `create extension if not exists "pgcrypto";` which on Supabase should succeed.
- RLS policies are created in the script; if you plan to use the Supabase dashboard to test, create a
  test user or use the service_role key for admin actions.

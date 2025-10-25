Apply Supabase SQL from GitHub Actions
=====================================

If your local machine cannot reach the Supabase DB (IPv6/DNS issues), you can run the SQL applier from a GitHub Actions runner which has normal internet connectivity.

Steps
1. In your GitHub repository go to Settings → Secrets → Actions and add a new secret named SUPABASE_DATABASE_URL containing your Supabase connection string (postgres://...)
   - Use the full connection string from Supabase (Project → Settings → Database → Connection string)
   - This is stored securely in GitHub Secrets and is not visible in the logs.

2. Commit and push the workflow (already added at `.github/workflows/apply-supabase-sql.yml`).

3. In GitHub, go to Actions → Apply Supabase SQL → Run workflow (choose branch and run).

4. Watch the logs. The runner will install `pg` and run `node ./scripts/apply-sql-node.js`. The Action will show success/failure and the applier's console output.

Notes
- If you prefer not to store the connection string in Secrets, you can paste `infra/supabase_schema.sql` manually into the Supabase Console SQL Editor and run it there (fast and safe).
- The Action only runs when you manually trigger it; it does not run automatically.

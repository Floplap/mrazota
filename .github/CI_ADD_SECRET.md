CI: how to add SUPABASE_DATABASE_URL secret and trigger the apply workflow

1) Create the repository secret (GitHub UI)
   - Go to your repository → Settings → Secrets and variables → Actions → New repository secret
   - Name: SUPABASE_DATABASE_URL
   - Value: the full Postgres connection string (example):
     postgres://postgres:<PASSWORD>@db.ndlmuwwznqodderoieoh.supabase.co:5432/postgres
   - Save.

2) Push the prepared branch (apply-sql)
   - From your local repo root (C:\MRAZOTA):
     git push origin apply-sql

3) Run the workflow
   - Go to Actions → find "Apply Supabase SQL" or "Scheduled Apply Supabase SQL" → Run workflow (or wait for push trigger).

4) Retrieve logs
   - After the run completes, open the run and download artifacts named apply-sql-logs or apply-sql-scheduled-logs.
   - Attach logs or paste contents here and I will analyze and finish verification.

CLI alternative (gh):
   gh secret set SUPABASE_DATABASE_URL --body 'postgres://postgres:YOUR_PASSWORD@db...:5432/postgres'
   git push origin apply-sql

Security note: do NOT paste the secret in public chat. Use GitHub Secrets or run locally.

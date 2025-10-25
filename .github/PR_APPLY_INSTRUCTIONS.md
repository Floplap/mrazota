PR: How to run the Supabase SQL applier via CI (safe workflow)
=============================================================

This document explains how to create a small pull request that triggers the CI job
to apply `infra/supabase_schema.sql` on a GitHub Actions runner. Use this when your
local machine cannot connect to the Supabase DB (for example, IPv6-only DNS issues).

Steps I can do for you (what I've already added):
- Added two workflows that run the Node SQL applier and upload logs as artifacts:
  - `.github/workflows/apply-supabase-sql.yml` (manual dispatch)
  - `.github/workflows/apply-supabase-sql-on-push.yml` (runs on push to branch `apply-sql`)

What you need to do once (these require repository settings access):
1. Add secret in GitHub: Settings → Secrets and variables → Actions → New repository secret
   - Name: `SUPABASE_DATABASE_URL`
   - Value: the full Supabase connection string (postgres://...)

2. Create branch and push (example commands for your machine):
   git checkout -b apply-sql
   git add .github/workflows/apply-supabase-sql.yml .github/workflows/apply-supabase-sql-on-push.yml
   git commit -m "chore(ci): add apply-supabase-sql workflows and diagnostics"
   git push origin apply-sql

3. Create a Pull Request from branch `apply-sql` → `main` (or your default branch). The push-based
   workflow will run automatically on push to branch `apply-sql`. Alternatively open the Actions tab
   and manually trigger the `Apply Supabase SQL` workflow (manual dispatch).

4. After the job runs, open the Actions run, download the artifact named `apply-sql-logs` and attach
   it here or paste the relevant parts of the log. The artifact contains `logs/apply-sql.log` with
   the applier output and diagnostics.

Security note: The secret must be set by you — I cannot add repository secrets from here. The workflows
read the secret only inside GitHub Actions and will not print the secret itself in logs.

If you want, I can prepare a branch locally with a PR-ready commit message and the exact files changed
— you'll still need to `git push` that branch to GitHub. Tell me if you want me to create the branch file
contents (I will add a small helper file `PR_READY.md` with the git commands to run).

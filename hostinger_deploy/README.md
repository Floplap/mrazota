# Hostinger Deployment — quick guide

This folder contains helper scripts and notes to deploy the site to Hostinger. I prepared two deploy helpers: `deploy_script.sh` (bash) and `deploy_script.ps1` (PowerShell). Use the method your Hostinger plan supports (SFTP/FTP, SSH).

Recommended flow (safe, minimal risk)

1. Backup production database
   - Export or snapshot your production DB (SQL dump, or use Hostinger DB backup UI). Do NOT run migrations before you have a backup.

2. Upload files to Hostinger
   - Option A (manual): use Hostinger File Manager or an SFTP client (WinSCP/FileZilla) to upload the site files from `F:\MRAZOTA\hostinger_deploy` or upload the built repo.
   - Option B (automatic): configure the GitHub Actions workflow `.github/workflows/deploy-to-hostinger.yml` with FTP credentials (see below). Pushing to `main` or `ai/auto-fixes` will trigger a deploy.

3. Set environment variables (hPanel -> App -> Environment)
   - Required: `DATABASE_URL` (if using Prisma), `JWT_SECRET`, any `NEXT_PUBLIC_*` keys, `NODE_ENV=production`.

4. Run deploy script on server (via SSH or the Hostinger terminal)
   - Bash: `bash deploy_script.sh`
   - PowerShell (Windows host): `powershell -ExecutionPolicy Bypass -File .\deploy_script.ps1`

5. Verify the app
   - Check `deploy_start.log` for runtime output.
   - Visit the site and test key pages and APIs. Roll back DB if migrations fail.

How to configure GitHub Actions (automatic FTP deploy)

1. Add these repository secrets (Settings -> Secrets -> Actions):
   - `HOSTINGER_FTP_HOST` — e.g. `ftp.example.hostinger.com`
   - `HOSTINGER_FTP_USER` — FTP username
   - `HOSTINGER_FTP_PASSWORD` — FTP password
   - `HOSTINGER_FTP_PATH` — remote path to deploy into (e.g. `/public_html` or the path your Hostinger app expects)

2. Push to `main` or `ai/auto-fixes` and the workflow will:
   - run `npm ci`, `npm run build` on GitHub
   - create an `upload/` directory with the build and required files
   - upload `upload/` to the remote FTP path

Notes and caveats
- The action uses FTP. If your plan supports SFTP or SSH, prefer SFTP/SSH for better security and permissions.
- I intentionally left the large zip archives out of git. Upload the local `hostinger_final_mrazota_deploy.zip` manually if you prefer a single-file transfer.
- Do not run `npx prisma migrate deploy` against production before making a backup.

If you want, I can:
- Prepare a one-click script to upload the local zip to Hostinger using WinSCP (PowerShell script that consumes credentials) — you will need to provide credentials or run locally.
- Migrate large files out of the entire repo history (BFG) and force-push — this is destructive and requires confirmation.
Hostinger deployment artifacts for Mrazota

This folder contains instructions and helper files to deploy the `mrazota-site` Next.js application to Hostinger.

Two deployment options are provided:

1) Node/Next runtime (recommended if your Hostinger plan supports Node.js apps)
   - Upload the `node_bundle` contents (see below). On the server run `npm ci` and either run build (`npm run build`) or use pre-built `.next` if you upload it.
   - Start command: `npm run start` or `npx next start -p $PORT` (Hostinger sets PORT environment variable).

2) Static hosting (only possible if your Next app uses static-only features)
   - This repository uses Next 15 which removed `next export`. If your site is fully static you can add `output: 'export'` to `next.config.js` and run `next build` on the server to generate static files. Otherwise use option (1).

Included:
- node_bundle/: files and instructions for Node-based deployment.
- legacy_README.md: where to find the legacy static files.
- backend_README.md: how to deploy the `offline-ai-site/backend` if needed.

Next steps:
- If you want, I can copy `.next` into `node_bundle` and create a zip ready for upload (this may be large). Reply "include .next" and I'll package it.

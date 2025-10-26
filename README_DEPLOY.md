# Deployment guide

This document explains how to publish the project after you've inserted your secrets.

1) Prepare secrets

- Copy `deploy.env.example` → `deploy.env` in repo root and fill values (SUPABASE keys, Paysera secrets, HOST_URL, JWT_SECRET). Do NOT commit `deploy.env`.

2) Choose hosting

- Hostinger (with Docker): Upload repository to your server (via Git/FTP/SSH), ensure Docker is installed, create `deploy.env` on the host, and run the `deploy.ps1` script on the server or run the `docker compose` commands manually.

- Hostinger (shared or managed hosting) — quick upload instructions:

	- Static site (recommended for simple frontend):
		1. Build the frontend: `cd frontend && npm ci && npm run build` (this repo already contains `frontend/dist`).
		2. Upload `frontend-deploy.zip` content into Hostinger File Manager or use FTP and place files into the `public_html` folder. Ensure `index.html` is at the root.

	- Fullstack (Docker on Hostinger VPS or cloud VPS):
		1. Use the prepared `fullstack-deploy.zip` (contains `mrazota-site/.next`, `backend/`, Dockerfiles and `deploy.env.example`).
		2. Upload and unzip on your Hostinger VPS, copy `deploy.env.example` → `deploy.env` and fill real secrets.
		3. Run `docker compose up -d --build` to start the application stack.

	Note: Hostinger shared hosting does not support Docker; for Docker deployments choose a VPS plan or external cloud provider.

- VPS / DigitalOcean: Use the `deploy.ps1` script or run the docker compose commands directly.

- Vercel (Next.js frontend only): Deploy `mrazota-site` by connecting the repository to Vercel, set environment variables in Vercel dashboard (PUBLIC keys only). For server and storage you still need the backend running with Supabase secrets.

3) Run deploy locally (for test/staging)

```powershell
Copy-Item .\deploy.env.example .\deploy.env
# Edit deploy.env and fill secrets
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& .\deploy.ps1
```

4) Post-deploy checks

- Verify backend: `GET /api/health` and `GET /api/debug/latest` (debug will return limited data if no service-role key).
- Run `backend/scripts/verify-deploy-ready.ps1` to perform automated checks and optionally run the upload test.

5) Apply Supabase SQL (required once)

- Open Supabase Console → SQL Editor and paste `infra/supabase_schema.sql`. Run it to create tables and RLS policies. This must be done once for your project.

6) Webhooks

- Configure Paysera callback/notification URL to point to `HOST_URL/api/paysera/webhook` and ensure `PAYSERA_SIGN_PASSWORD` is configured.

If you want, I can generate a `systemd` unit for running `docker compose` on a Linux host, or add CI/CD configuration (GitHub Actions) to build and push images. Tell me which target host you plan to use.

CI & systemd (optional)
-----------------------
I've added a GitHub Actions workflow `/.github/workflows/ci.yml` to build and push images to Docker Hub (you must set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in GitHub Secrets).

- Manual deploy workflow: `/.github/workflows/deploy.yml` — this is a manual `workflow_dispatch` workflow that will rsync the repo to your server and run `docker compose` remotely. It requires the following GitHub secrets configured in your repository Settings → Secrets:
	- `SSH_HOST` - target host (IP or hostname)
	- `SSH_USER` - user to SSH as
	- `SSH_PRIVATE_KEY` - private key (begin with -----BEGIN OPENSSH PRIVATE KEY-----)
	- `REMOTE_PATH` - remote path where repo is deployed (e.g. `/home/ubuntu/mrazota`)
	- `SSH_PORT` - optional (defaults to 22)

- systemd unit: a template is available at `deploy/systemd/mrazota.service`. On your server copy it to `/etc/systemd/system/mrazota.service`, adjust `WorkingDirectory` and `ExecStart` if needed, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mrazota.service
sudo systemctl status mrazota.service
```

This will ensure your Docker Compose stack starts on boot and can be managed with systemd.

Hostinger package
------------------

I created a convenience package `hostinger_package.zip` (at the repository root) which contains the `frontend/dist` static build, the `mrazota-site/.next` Next build, and minimal `package.json`/`backend/src` for the server API. Use `README_HOSTINGER_DEPLOY.md` (also at repo root) for quick deployment notes for Hostinger.

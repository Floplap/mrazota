# Hostinger deployment package (generated)

This archive contains two deployment options:

- `static_frontend/` — the Vite-built static site (from `frontend/dist`). This can be uploaded to Hostinger's File Manager (shared hosting) and will work by opening `index.html`.
- `next_server/` — the Next.js site prepared for container deployment. This folder includes the built `.next` directory and a `Dockerfile`. Use the Dockerfile to build the image and run the Next server (or run `npm ci && npm start`).

Quick instructions

1) Static frontend (recommended for shared Hostinger):

  - Upload the contents of `static_frontend/` to your Hostinger site's `public_html/` (or the folder Hostinger expects).
  - Ensure `index.html` is at the site root. The static bundle is fully self-contained.

2) Next.js server (requires VPS or Hostinger with Docker support):

  - Copy `next_server/` to the host or build via Docker.
  - Build with Docker: `docker build -t mrazota-site:latest .` and run `docker run -p 3000:3000 --env-file .env.next_server -d mrazota-site:latest` (create a `.env.next_server` from `.env.example`).
  - Or on the server: `npm ci && npm run start` (requires Node 20+ and environment variables set).

Notes

- API routes (under `/api/*`) require a running Node process (Next server) or separate backend. They are not supported by the static frontend export.
- For full production, supply real `DATABASE_URL`, `PAYSERA_SIGN_PASSWORD`, and other secrets in `mrazota-site/.env` or via your hosting secret manager.

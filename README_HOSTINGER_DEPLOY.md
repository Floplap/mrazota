This archive contains the built artifacts for deploying to Hostinger.

Included:
- frontend/dist/  — static files from the Vite frontend (copy to web root or configure static hosting)
- mrazota-site/.next/ — Next.js build output (server/edge functions)
- mrazota-site/package.json — contains scripts to start the Next server
- backend/src/ + backend/package.json — server-side API if you deploy separately

Notes:
1. Hostinger supports Node hosting on some plans. If deploying the Next app as a Node app, upload the `mrazota-site` folder and run `npm install` then `npm start` (or use the provided start script).
2. For static-only hosting, use the contents of `frontend/dist`.
3. You may need to set environment variables on Hostinger matching `deploy.env` (see `deploy.env.example`).
4. Before deploying, run `npm install` in the relevant folders on the Hostinger server to install dependencies.

Quick local steps after extracting the archive:
- cd mrazota-site
- npm install --production
- npm start

If you want, I can create a more tailored Hostinger deploy package (e.g., static-only, serverless functions, or a combined Docker image).
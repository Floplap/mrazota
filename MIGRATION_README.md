# Legacy site migration helper

This file documents repeatable steps to rebuild the legacy Vite SPA and mirror its `dist` into this Next.js project's `public/` folder for static serving and visual testing.

Paths (workspace-relative):
- Legacy source (if present): `public/legacy_full` 
- Legacy build output (source of truth): `public/legacy_full/dist`
- Served assets location: `public/assets`
- Served entry: `public/dist/index.html` and `public/index.html` (if you want the SPA at site root)
- Diagnostic outputs and baseline: `ai_checks/screenshots` and `ai_checks/baseline`

Scripts included:
- `scripts/build_and_mirror.ps1` — PowerShell helper that builds the legacy app (via `npm --prefix`) and copies the `dist` artifacts into `public/`.
- `scripts/_tmp_static_server.js` — small static server used for deterministic local testing (binds to 127.0.0.1:3002 by default).
- `scripts/diagnose_dist.mjs` — Playwright harness that captures console, network, page errors, HTML snapshot and screenshots.
- `scripts/visual_compare.mjs` — pixelmatch comparator used to compare screenshots with a baseline.

Quick start (PowerShell, from repo root `F:\MRAZOTA\mrazota-site`):

1) Build legacy and mirror into `public/`:

```powershell
# run the included helper
.\scripts\build_and_mirror.ps1
```

2) Serve `public/` deterministically (in another terminal):

```powershell
node .\scripts\_tmp_static_server.js
# server binds to 127.0.0.1:3002 by default
```

3) Run diagnostics to generate a canonical screenshot + snapshot:

```powershell
node .\scripts\diagnose_dist.mjs
# writes ai_checks/screenshots/dist-diagnostics.json and screenshots
```

4) Run visual compare (creates baseline if missing):

```powershell
pushd ..\  # visual_compare expects cwd = mrazota-site
node .\scripts\visual_compare.mjs
popd
```

Notes and safety:
- The helper script uses `Copy-Item -Recurse -Force` to mirror files; it will overwrite existing files in `public/assets` and `public/index.html`. The script makes a timestamped backup of any `public/index.html` / `public/dist/index.html` that already exist.
- This repo intentionally does not include secrets (Supabase keys). For local auth-driven flows, either provide the necessary env files locally or use the diagnostic bypass present in the legacy source (only used during debugging).
- After verification, ensure any diagnostic instrumentation (temporary console/postMessage snippets) is removed or gated behind a test-only flag before merging.

If you'd like, I can now:
- Commit these helper files and export a patch to `.gitpatches/` so you can review and push the changes, or
- Run the build-and-mirror helper and then run diagnostics + visual-compare end-to-end and report results.

Tell me which of the two you prefer or I can do both automatically.
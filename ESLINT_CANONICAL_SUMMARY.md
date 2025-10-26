Canonical ESLint summary (generated)

Date: 2025-10-26 (run in workspace C:\MRAZOTA)
Branch: fix/mass-fix-20251026-193537

Summary (authoritative per-package lint runs):
- frontend: 0 errors, 0 warnings (ran: cd frontend && npx eslint . --ext .ts,.tsx,.js,.jsx -f json --fix)
- mrazota-site (Next.js): 0 errors, 0 warnings (ran: cd mrazota-site && npm run lint -- --format=json)
- backend: 0 errors, 0 warnings (ran: cd backend && npx eslint . --ext .ts,.tsx,.js,.jsx -f json --fix)

Notes and root-cause:
- Earlier "281 errors / 181 warnings" and other inflated counts were caused by running a repo-wide ESLint scan that picked up generated artifacts (e.g. .next, build/dist chunks) and TypeScript/Next-generated files without package-local parser/config. These produced many parsing errors that are not actionable in source.
- Using each package's recommended linter (Next's `next lint` for the Next.js app and package-local ESLint configs for frontend/backend) yields a clean result.

Repro steps (recommended canonical checks):
1) Frontend: cd frontend; npx eslint . --ext .ts,.tsx,.js,.jsx -f json --max-warnings=0
2) Site (Next): cd mrazota-site; npm run lint -- --format=json --max-warnings=0
3) Backend: cd backend; npx eslint . --ext .ts,.tsx,.js,.jsx -f json --max-warnings=0

If you want, I can:
- Update the repo-level ESLint config to only run package-local configs (recommended), or
- Update .eslintignore to ensure generated files are excluded from repo-scans, and re-run a repo-wide lint filtered by .eslintignore to produce a single repo-wide JSON summary.

What I changed so far (branch fix/mass-fix-20251026-193537):
- Created and committed .eslintignore to exclude .next, frontend/dist, hostinger_package, node_modules, etc.
- Ran package-local eslint --fix across frontend/backend and used next lint for mrazota-site.
- Created many intermediate JSON reports under the repo root for debugging; they can be removed if you want a clean branch.

Next suggestion: I can reconcile the repo-wide counts by running ESLint with --ignore-path .eslintignore at the repo root and produce a single filtered JSON report. Proceed if you'd like me to do that and commit the result.

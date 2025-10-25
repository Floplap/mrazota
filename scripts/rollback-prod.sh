#!/usr/bin/env bash
set -euo pipefail

echo "=== rollback-prod helper ==="

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found in PATH. Install it or run this script from a runner with supabase installed."
else
  echo "supabase CLI found: $(supabase --version 2>/dev/null || true)"
fi

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "WARN: SUPABASE_PROJECT_REF is not set. Set it to your production project ref to enable automated steps."
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "WARN: SUPABASE_ACCESS_TOKEN is not set. Some supabase CLI commands may fail without it."
fi

echo
echo "Available high-level rollback options (manual):"
echo "  * Restore DB from a snapshot/backup (pg_dump/pg_restore or your provider snapshot)."
echo "  * Redeploy previous function version (checkout tag/commit and run 'supabase functions deploy')."
echo "This helper can optionally apply a SQL rollback file if present: supabase/rollback.sql"

ROLLBACK_SQL="supabase/rollback.sql"

if [ -f "$ROLLBACK_SQL" ]; then
  echo "Found $ROLLBACK_SQL"
  if [ "${AUTO_ROLLBACK:-}" = "yes" ]; then
    if [ -z "${DATABASE_URL:-}" ]; then
      echo "ERROR: DATABASE_URL not set; cannot run psql to apply rollback.sql"
      exit 1
    fi
    echo "Applying $ROLLBACK_SQL to DATABASE_URL"
    psql "$DATABASE_URL" -f "$ROLLBACK_SQL"
    echo "Applied $ROLLBACK_SQL"
  else
    echo "To auto-apply this SQL set environment variable AUTO_ROLLBACK=yes and ensure DATABASE_URL is set."
    echo "Example: AUTO_ROLLBACK=yes DATABASE_URL='postgres://user:pass@host:5432/db' ./scripts/rollback-prod.sh"
  fi
else
  echo "No rollback SQL file found at $ROLLBACK_SQL"
fi

if command -v supabase >/dev/null 2>&1; then
  echo
  echo "Supabase functions list (project ref: ${SUPABASE_PROJECT_REF:-<not-set>}):"
  if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
    supabase functions list --project-ref "$SUPABASE_PROJECT_REF" || true
  else
    supabase functions list || true
  fi
fi

echo
echo "Rollback helper finished. Review the steps above and perform manual restore if needed."

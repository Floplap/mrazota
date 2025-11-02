#!/usr/bin/env bash
set -euo pipefail

# deploy_script.sh
# Usage: upload this repo to Hostinger app directory and run:
#   bash deploy_script.sh
# It will: install deps, generate Prisma client, run migrations, build and start the app.

APP_DIR="$(pwd)"
echo "Deploy script running in: $APP_DIR"

# Ensure npm exists
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node >=18 and npm." >&2
  exit 2
fi

# Install dependencies
echo "Installing dependencies..."
npm ci --prefer-offline --no-audit --progress=false

# Generate Prisma client if prisma schema present
if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

# Run migrations in production mode (make sure DATABASE_URL env var is set)
if [ -n "${DATABASE_URL:-}" ]; then
  if [ -d "prisma" ] && [ -f "prisma/migrations" ]; then
    echo "Running Prisma migrations (deploy)..."
    npx prisma migrate deploy
  else
    echo "No Prisma migrations found; skipping prisma migrate deploy"
  fi
else
  echo "WARNING: DATABASE_URL not set — skipping prisma migrate deploy (set DATABASE_URL to run migrations)" >&2
fi

# Build (only if .next missing)
if [ ! -d ".next" ]; then
  echo "Building Next app..."
  npm run build
else
  echo ".next exists — skipping build"
fi

# Start the app using npm script (Hostinger will set PORT env)
echo "Starting app..."
# Use npx next start which respects process.env.PORT, or npm run start
if npm run start --silent >/dev/null 2>&1; then
  # Start via npm run start in background using nohup so it survives session close
  nohup npm run start > deploy_start.log 2>&1 &
  echo "App started (logs -> deploy_start.log)."
else
  echo "Failed to start via npm run start; trying npx next start -p \${PORT:-3000}"
  nohup npx next start -p "${PORT:-3000}" > deploy_start.log 2>&1 &
  echo "App started with npx next start (logs -> deploy_start.log)."
fi

echo "Deploy script finished. Check logs in deploy_start.log and Hostinger panel for app status." 

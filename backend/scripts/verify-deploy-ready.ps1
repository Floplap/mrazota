<#
verify-deploy-ready.ps1

Performs a set of checks to confirm this repository is ready to publish.
It does NOT upload keys or perform any network changes by itself. Run locally
after you populate `backend/.env` with your real SUPABASE keys.

Checks performed:
- backend/.env exists and contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- backend health endpoint responds
- debug endpoint returns admin data (or warns if only anon key present)
- optional: run scripts/upload-test.js to upload a test image and insert a post (requires SUPABASE_SERVICE_ROLE_KEY)
- build frontend projects (`mrazota-site` and `frontend`) to confirm build succeeds

Usage (from repo root C:\MRAZOTA):
  # make sure ExecutionPolicy allows the script for this session
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  & .\backend\scripts\verify-deploy-ready.ps1

This script exits with non-zero code if a critical check fails.
#>

param(
  [switch]$RunUploadTest  # pass -RunUploadTest to attempt the upload-test (requires service role key)
)

function Fail([string]$msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

Write-Host "Starting deploy readiness checks" -ForegroundColor Cyan

$backendEnv = Join-Path (Resolve-Path .\backend).Path '.env'
if (-not (Test-Path $backendEnv)) {
  Fail "backend/.env not found. Run backend/scripts/create-env.ps1 and fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
}

$envText = Get-Content $backendEnv -ErrorAction Stop | Out-String
if ($envText -notmatch 'SUPABASE_URL\s*=') { Fail 'SUPABASE_URL missing in backend/.env' }
if ($envText -notmatch 'SUPABASE_SERVICE_ROLE_KEY\s*=') { Write-Host 'Warning: SUPABASE_SERVICE_ROLE_KEY missing in backend/.env. Admin operations will not work.' -ForegroundColor Yellow }

Write-Host 'Checking backend health endpoint...' -ForegroundColor Cyan
try {
  $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get -TimeoutSec 5
  if ($health.status -ne 'ok') { Write-Host 'Health returned unexpected payload' -ForegroundColor Yellow }
  else { Write-Host 'Backend health: ok' -ForegroundColor Green }
} catch {
  Write-Host "Could not contact backend at http://localhost:5000. Ensure the server is running (npm run start)." -ForegroundColor Red
  Fail 'Backend not reachable on port 5000'
}

Write-Host 'Checking debug endpoint...' -ForegroundColor Cyan
try {
  $debug = Invoke-RestMethod -Uri 'http://localhost:5000/api/debug/latest' -Method Get -ErrorAction Stop
  if ($debug.error) {
    Write-Host "Debug endpoint responded with: $($debug.error)" -ForegroundColor Yellow
    if ($debug.how_to_fix) { $debug.how_to_fix | ForEach-Object { Write-Host " - $_" } }
  } else {
    Write-Host 'Debug endpoint returned admin data (good).' -ForegroundColor Green
  }
} catch {
  Write-Host "Failed to call debug endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($RunUploadTest) {
  Write-Host 'Running upload-test.js to ensure storage and DB operations work (requires SUPABASE_SERVICE_ROLE_KEY)...' -ForegroundColor Cyan
  Push-Location .\scripts
  try {
    # run with node; script is resilient and self-installs client into tmp_node_modules
    node upload-test.js
    Write-Host 'upload-test.js finished (check logs above for success).' -ForegroundColor Green
  } catch {
    Write-Host "upload-test failed: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    Fail 'upload-test failed'
  }
  Pop-Location
}

Write-Host 'Building frontend projects (this may take a while)...' -ForegroundColor Cyan

# Build mrazota-site (Next.js)
if (Test-Path .\mrazota-site\package.json) {
  Write-Host 'Building mrazota-site (Next.js)...' -ForegroundColor Cyan
  try {
    npm --prefix .\mrazota-site install --no-audit --no-fund
    npm --prefix .\mrazota-site run build
    Write-Host 'mrazota-site build succeeded.' -ForegroundColor Green
  } catch {
    Write-Host "mrazota-site build failed: $($_.Exception.Message)" -ForegroundColor Red
    Fail 'mrazota-site build failed'
  }
} else { Write-Host 'mrazota-site not present, skipping.' -ForegroundColor Yellow }

# Build frontend (Vite) if present
if (Test-Path .\frontend\package.json) {
  Write-Host 'Building frontend (Vite/Tailwind)...' -ForegroundColor Cyan
  try {
    npm --prefix .\frontend install --no-audit --no-fund
    npm --prefix .\frontend run build
    Write-Host 'frontend build succeeded.' -ForegroundColor Green
  } catch {
    Write-Host "frontend build failed: $($_.Exception.Message)" -ForegroundColor Red
    Fail 'frontend build failed'
  }
} else { Write-Host 'frontend not present, skipping.' -ForegroundColor Yellow }

Write-Host 'All checks completed successfully. If all steps passed, the project is ready to publish.' -ForegroundColor Green
exit 0

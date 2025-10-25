<#[
Complete setup script for Mrazota

Usage (PowerShell): run this from the repository root (C:\MRAZOTA)

# You can export env vars in the same command line, for example:
# $env:SUPABASE_URL='https://...'; $env:SUPABASE_SERVICE_ROLE_KEY='srk...'; $env:TEST_PROFILE_ID='uuid'; pwsh -ExecutionPolicy Bypass -File .\scripts\complete-setup-all.ps1

This script will:
- create backend/.env from env vars if present
- install npm deps for backend and frontend (with safe local prefix fallback)
- try to apply infra/supabase_schema.sql using psql if DATABASE_URL is present
- attempt to start the backend in a background process
- run node .\scripts\upload-test.js to upload a test image (will auto-install supabase client locally)

Notes: This script attempts non-destructive automation but cannot access your Supabase Console directly.
#>

Set-StrictMode -Version Latest

function Write-Log($msg){ Write-Host "[setup] $msg" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
# repo root is the parent of the script directory
$repo = Split-Path -Parent $scriptDir
Set-Location $repo

Write-Log "Repository root: $repo"

# 1) Build backend .env if env vars present
$envFile = Join-Path $repo 'backend\.env'
if ($env:SUPABASE_URL -or $env:SUPABASE_SERVICE_ROLE_KEY -or $env:PAYSERA_PROJECT_ID) {
  Write-Log "Writing backend/.env from environment variables..."
  $content = @()
  if ($env:SUPABASE_URL) { $content += "SUPABASE_URL=$env:SUPABASE_URL" }
  if ($env:SUPABASE_SERVICE_ROLE_KEY) { $content += "SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY" }
  if ($env:JWT_SECRET) { $content += "JWT_SECRET=$env:JWT_SECRET" } else { $content += "JWT_SECRET=replace_with_random_string" }
  if ($env:PAYSERA_PROJECT_ID) { $content += "PAYSERA_PROJECT_ID=$env:PAYSERA_PROJECT_ID" }
  if ($env:PAYSERA_SECRET) { $content += "PAYSERA_SECRET=$env:PAYSERA_SECRET" }
  if ($env:PAYSERA_RETURN_URL) { $content += "PAYSERA_RETURN_URL=$env:PAYSERA_RETURN_URL" }
  if ($env:PORT) { $content += "PORT=$env:PORT" } else { $content += "PORT=5000" }
  $content | Out-File -FilePath $envFile -Encoding utf8 -Force
  Write-Log "Wrote $envFile"
} else {
  Write-Log "Environment variables for Supabase/Paysera not found in this shell. Skipping .env creation. You can still create backend/.env manually from backend/.env.example"
}

# Helper: run npm install with fallback
function Safe-Npm-Install($targetDir) {
  Write-Log "Installing npm dependencies in $targetDir"
  Push-Location $targetDir
  try {
    & npm install --no-audit --no-fund 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
  } catch {
    Write-Log "npm install failed, trying local-prefix fallback (tmp_node_modules)"
    $prefix = Join-Path $repo 'tmp_node_modules'
    New-Item -ItemType Directory -Path $prefix -Force | Out-Null
    & npm install --prefix $prefix --no-audit --no-fund 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { Write-Log 'Fallback npm install failed. Please run manually.'; Pop-Location; return $false }
    # set NODE_PATH for the session so node can find locally installed packages
    $nodeModules = Join-Path $prefix 'node_modules'
    $env:NODE_PATH = if ($env:NODE_PATH) { "$env:NODE_PATH;$nodeModules" } else { $nodeModules }
    Write-Log "Set NODE_PATH to $env:NODE_PATH"
  }
  Pop-Location
  return $true
}

# 2) Install backend deps
Safe-Npm-Install (Join-Path $repo 'backend') | Out-Null

# 3) Install frontend deps
Safe-Npm-Install (Join-Path $repo 'frontend') | Out-Null

# 4) Try to apply SQL if psql available and DATABASE_URL env var present
if ($env:DATABASE_URL) {
  Write-Log "DATABASE_URL found in env. Checking for psql..."
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if ($psql) {
    Write-Log "psql found. Applying infra/supabase_schema.sql..."
    & psql $env:DATABASE_URL -f (Join-Path $repo 'infra\supabase_schema.sql') 2>&1 | Write-Host
  } else {
    Write-Log "psql not found. Copying SQL to clipboard and printing instructions. Open Supabase Console → SQL Editor and paste the SQL."
    Get-Content (Join-Path $repo 'infra\supabase_schema.sql') -Raw | Set-Clipboard
    Write-Log "SQL copied to clipboard. Paste into Supabase Console → SQL Editor and Run."
  }
} else {
  Write-Log "DATABASE_URL not set. Skipping automated SQL apply. To apply SQL, run scripts/apply-supabase-sql.ps1 or paste infra/supabase_schema.sql into Supabase SQL Editor."
}

# 5) Start backend (background)
$backendDir = Join-Path $repo 'backend'
if (Test-Path (Join-Path $backendDir 'package.json')) {
  Write-Log "Starting backend (node backend/src/server.js) in background using Node..."
  $serverEntry = Join-Path $backendDir 'src\server.js'
  if (Test-Path $serverEntry) {
    # Use node directly to avoid depending on npm/pwsh behavior
    Start-Process -FilePath 'node' -ArgumentList "$serverEntry" -WorkingDirectory $backendDir -NoNewWindow -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2
    Write-Log "Backend start command issued (node). If the server didn't start, open a terminal and run 'npm run start' in backend folder to see logs."
  } else {
    Write-Log "Server entry $serverEntry not found; attempted npm start instead."
    Start-Process -FilePath npm -ArgumentList 'run','start' -WorkingDirectory $backendDir -NoNewWindow -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2
  }
} else {
  Write-Log "Backend package.json not found; skipping start."
}

# 6) Run upload-test to create bucket/upload image/insert post
Write-Log "Running upload-test.js (will auto-install @supabase/supabase-js locally if needed)."
try {
  node (Join-Path $repo 'scripts\upload-test.js') 2>&1 | Write-Host
} catch {
  Write-Log "upload-test failed. Check previous output for errors."
}

Write-Log "Complete setup script finished. Check above output for errors."

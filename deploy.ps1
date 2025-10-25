<#
deploy.ps1

Usage (from repo root `C:\MRAZOTA`):
  # Create deploy.env from deploy.env.example and fill secrets
  Copy-Item .\deploy.env.example .\deploy.env
  # Edit deploy.env -> replace placeholders with real keys

  # Run deploy script (this will build images and start docker compose)
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  & .\deploy.ps1

Notes:
- This script expects Docker and Docker Compose (v2) to be installed.
- It will use `docker compose` and the env file named `deploy.env` in repo root.
- It does NOT store secrets in the repo; you must create `deploy.env` locally or provide secrets via your host's secret manager.
#>

function Fail([string]$msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

Write-Host "Starting deploy script" -ForegroundColor Cyan

# Check for Docker
try {
  & docker --version > $null 2>&1
} catch {
  Fail 'Docker not found. Install Docker Desktop or Docker Engine before running this script.'
}

# Check for docker compose
try {
  & docker compose version > $null 2>&1
} catch {
  Fail 'docker compose not available. Ensure Docker Compose v2 (docker compose ...) is installed.'
}

$envFile = Join-Path -Path (Get-Location).Path -ChildPath 'deploy.env'
if (-not (Test-Path $envFile)) {
  Write-Host 'deploy.env not found in repo root.' -ForegroundColor Yellow
  Write-Host 'Create it by copying deploy.env.example and filling your secrets:' -ForegroundColor Yellow
  Write-Host '  Copy-Item .\deploy.env.example .\deploy.env' -ForegroundColor Gray
  Fail 'Missing deploy.env'
}

Write-Host "Using env file: $envFile" -ForegroundColor Green

# Compose with env-file
try {
  Write-Host 'Building and starting containers with docker compose (this may take a while)...' -ForegroundColor Cyan
  & docker compose --env-file $envFile up -d --build
} catch {
  Fail "docker compose failed: $($_.Exception.Message)"
}

Write-Host 'Containers started. Showing status:' -ForegroundColor Cyan
& docker compose ps

Write-Host 'Waiting a few seconds for services to initialize...' -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Quick health check (assumes backend on localhost:5000 - if deploying to remote, check domain instead)
try {
  $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get -TimeoutSec 5
  if ($health.status -eq 'ok') { Write-Host 'Backend health: ok' -ForegroundColor Green }
  else { Write-Host "Backend returned unexpected health: $($health | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow }
} catch {
  Write-Host 'Health check failed. Check container logs:' -ForegroundColor Yellow
  & docker compose logs --tail 50
}

Write-Host 'If you deployed to a remote server, set HOST_URL in deploy.env to the public URL and run the verify script locally or via ssh.' -ForegroundColor Cyan
Write-Host 'Deploy script finished.' -ForegroundColor Green
exit 0

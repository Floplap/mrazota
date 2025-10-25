# Helper PowerShell script to load a local private .env file and start the backend
# Usage: from repository root or anywhere: pwsh -File ./backend/scripts/start-with-env.ps1
# Place your private values in `backend/.env.local` (this file should NOT be committed).

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$envFile = Join-Path $scriptDir "..\.env.local" | Resolve-Path -ErrorAction SilentlyContinue

if (-not $envFile) {
    Write-Host "No backend/.env.local found. Create one from backend/.env.local.example and set your secrets." -ForegroundColor Yellow
    exit 1
}

$content = Get-Content $envFile
foreach ($line in $content) {
    if ($line -match '^[\s#]*$') { continue }
    if ($line.TrimStart().StartsWith('#')) { continue }
    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) { continue }
    $name = $parts[0].Trim()
    $value = $parts[1]
    # Set the environment variable for this PowerShell session
    Set-Item -Path Env:\$name -Value $value
}

# Change to backend folder and start the server so it inherits the env vars
Set-Location (Join-Path $scriptDir "..")
Write-Host "Starting backend (env loaded from backend/.env.local)..." -ForegroundColor Green
npm run start

<#
One-step local setup script.
Prompts for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (secure), kills any process listening on port 5000,
writes `backend/.env.local`, starts the backend in a new window (temp .bat), polls the debug endpoint and prints the result.

Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\scripts\auto-setup-and-start.ps1

Security: the script writes your key to `backend/.env.local` (gitignored). It also creates a temporary
batch file in %TEMP% to start the server; the path will be printed so you can delete it afterwards.
#>

Write-Host "Auto setup: you will be prompted to paste your Supabase URL and Service Role Key." -ForegroundColor Cyan

$supabaseUrl = Read-Host -Prompt "SUPABASE_URL (e.g. https://your-project.supabase.co)"
$secureKey = Read-Host -Prompt "SUPABASE_SERVICE_ROLE_KEY (input will be hidden)" -AsSecureString

if (-not $supabaseUrl -or -not $secureKey) {
    Write-Host "Both values are required. Exiting." -ForegroundColor Red
    exit 1
}

# Convert secure string to plain text for writing to .env.local (kept in memory only)
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try { $supabaseKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

# Kill processes listening on port 5000 (if any)
Write-Host "Checking for processes listening on port 5000..." -ForegroundColor Yellow
try {
    $listeners = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
} catch {
    $listeners = $null
}

if ($listeners) {
    foreach ($procId in $listeners) {
        try {
            Write-Host "Stopping process PID $procId" -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host ("Failed to stop PID " + $procId + ": " + $_) -ForegroundColor Red
        }
    }
} else {
    Write-Host "No process found listening on port 5000." -ForegroundColor Green
}

# Write backend/.env.local
$envLocalPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot ".." )).Path ".env.local"
Write-Host "Writing $envLocalPath" -ForegroundColor Cyan
$envContent = @()
$envContent += "SUPABASE_URL=$supabaseUrl"
$envContent += "SUPABASE_SERVICE_ROLE_KEY=$supabaseKey"
$envContent += "PORT=5000"
[System.IO.File]::WriteAllLines($envLocalPath, $envContent, [System.Text.Encoding]::UTF8)

Write-Host "Created backend/.env.local (do NOT commit this file)." -ForegroundColor Yellow

# Create temporary batch file to launch the backend with env set in the child process
$backendDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$tmpFile = [System.IO.Path]::Combine($env:TEMP, "start_backend_" + [System.Guid]::NewGuid().ToString() + ".bat")
$batLines = @()
$batLines += "@echo off"
$batLines += ("set SUPABASE_URL=" + $supabaseUrl)
$batLines += ("set SUPABASE_SERVICE_ROLE_KEY=" + $supabaseKey)
$batLines += ("set PORT=5000")
$batLines += "cd /d " + $backendDir
$batLines += "echo Starting backend (this window shows server output)."
$batLines += "npm run start"
[System.IO.File]::WriteAllLines($tmpFile, $batLines, [System.Text.Encoding]::UTF8)

Write-Host "Starting backend in a new window..." -ForegroundColor Cyan
Start-Process -FilePath $tmpFile -WorkingDirectory $backendDir -WindowStyle Normal

Write-Host "Polling http://localhost:5000/api/debug/latest for up to 60s..." -ForegroundColor Cyan
$timeout = 60; $interval = 2; $elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/debug/latest' -Method Get -ErrorAction Stop
        Write-Host "Endpoint responded:" -ForegroundColor Green
        $resp | ConvertTo-Json -Depth 5
        break
    } catch {
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }
}

if ($elapsed -ge $timeout) {
    Write-Host "Timed out waiting for backend. Check the server window for errors." -ForegroundColor Red
} else {
    Write-Host "Backend appears up and responding." -ForegroundColor Green
}

Write-Host ("Temporary launcher file: " + $tmpFile) -ForegroundColor Yellow
Write-Host ("If you want to remove the temp launcher, run: Remove-Item -Path '" + $tmpFile + "'") -ForegroundColor Yellow
Write-Host "Done. Your .env.local contains the secret and the server should be running in the new window." -ForegroundColor Green

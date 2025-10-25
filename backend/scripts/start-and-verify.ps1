<#
Interactive helper: prompts for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
starts the backend in a new window (so it keeps running), then polls
http://localhost:5000/api/debug/latest until it responds or times out.

Usage: pwsh -File ./backend/scripts/start-and-verify.ps1

Security: the script creates a temporary .bat file in the system TEMP folder
that contains the environment variables for the child process. The temp file
is NOT committed to the repo. Do NOT paste secrets into chat.
#>

Write-Host "This script will prompt for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and start the backend." -ForegroundColor Cyan

$supabaseUrl = Read-Host -Prompt "SUPABASE_URL (e.g. https://your-project.supabase.co)"
$supabaseKey = Read-Host -Prompt "SUPABASE_SERVICE_ROLE_KEY (will be visible as you type)"

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Both values are required. Exiting." -ForegroundColor Red
    exit 1
}

$backendDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) ".."
$backendDir = (Resolve-Path $backendDir).Path

# Create temporary batch file that sets env vars then runs npm start in backend
$tmpFile = [System.IO.Path]::Combine($env:TEMP, "start_backend_" + [System.Guid]::NewGuid().ToString() + ".bat")
$batContent = @()
$batContent += "@echo off"
$batContent += ("set SUPABASE_URL=" + $supabaseUrl)
$batContent += ("set SUPABASE_SERVICE_ROLE_KEY=" + $supabaseKey)
$batContent += "cd /d " + $backendDir
$batContent += "echo Starting backend..."
$batContent += "npm run start"

[System.IO.File]::WriteAllLines($tmpFile, $batContent, [System.Text.Encoding]::UTF8)

Write-Host "Created temporary start script: $tmpFile" -ForegroundColor Yellow

# Launch the batch in a new window so the server keeps running after this script exits
Start-Process -FilePath $tmpFile -WorkingDirectory $backendDir -WindowStyle Normal

Write-Host "Waiting for backend to become ready on http://localhost:5000/api/debug/latest (timeout 60s)..." -ForegroundColor Cyan

$timeout = 60
$interval = 2
$elapsed = 0
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

Write-Host "Note: the temporary file containing the secret remains in $tmpFile until you delete it." -ForegroundColor Yellow
Write-Host "You can delete it now (recommended) by running: Remove-Item -Path '$tmpFile'" -ForegroundColor Yellow

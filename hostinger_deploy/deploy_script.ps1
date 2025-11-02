<#
deploy_script.ps1 - PowerShell deployment helper for Hostinger
Run in the app directory on the server (after uploading and setting env vars):
    powershell -ExecutionPolicy Bypass -File .\deploy_script.ps1
What it does:
 - checks Node/npm
 - runs npm ci
 - runs npx prisma generate (if prisma/schema.prisma exists)
 - runs npx prisma migrate deploy (if DATABASE_URL set and migrations present)
 - runs npm run build (if .next missing)
 - starts app with Start-Process so it survives session close (logs to deploy_start.log)
#>

Param()

Write-Output "Running deploy_script.ps1 in: $(Get-Location)"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node >=18 and npm on the server before running this script."; exit 2
}

Write-Output "Installing dependencies..."
npm ci --no-audit --no-fund

if (Test-Path -Path './prisma/schema.prisma') {
    Write-Output "Generating Prisma client..."
    npx prisma generate
}

if ($env:DATABASE_URL) {
    if (Test-Path -Path './prisma/migrations') {
        Write-Output "Running Prisma migrations (deploy)..."
        npx prisma migrate deploy
    } else {
        Write-Output "No Prisma migrations found; skipping prisma migrate deploy"
    }
} else {
    Write-Warning "DATABASE_URL not set ΓÇö skipping prisma migrate deploy (set DATABASE_URL to run migrations)"
}

if (-not (Test-Path -Path '.\.next')) {
    Write-Output ".next missing ΓÇö running build..."
    npm run build
} else {
    Write-Output ".next exists ΓÇö skipping build"
}

# Start the app and redirect output to a log file
$log = Join-Path (Get-Location) 'deploy_start.log'
Write-Output "Starting app, logs -> $log"
$psi = @{FilePath='npm'; ArgumentList='run start'; NoNewWindow=$false; RedirectStandardOutput=$log; RedirectStandardError=$log}
Start-Process @psi | Out-Null
Write-Output "Started npm run start (detached)."

Write-Output "Deploy script finished. Check $log and the Hostinger panel for process status." 

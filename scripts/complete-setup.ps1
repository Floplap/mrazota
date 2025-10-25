<#
complete-setup.ps1

Single-entry script that attempts to fully prepare your environment and apply the project SQL.
It will:
 - Try to install Node.js (LTS) and PostgreSQL client (psql) via winget if available.
 - Fix npm config (prefix/tmp)
 - Install project dependencies (npm install)
 - Ensure @supabase/supabase-js is installed
 - Optionally apply `infra/supabase_schema.sql` using psql if you provide -DatabaseUrl
 - Optionally upload test image and insert test post if you provide Supabase keys

USAGE (run as Administrator for full automation):
.\scripts\complete-setup.ps1 [-DatabaseUrl <postgres-url>] [-AnonKey <anon-key>] [-ServiceRoleKey <service-role-key>] [-TestProfileId <uuid>] [-RunUpload]

Examples:
# Full automated with DB apply and upload (you must provide credentials)
.\scripts\complete-setup.ps1 -DatabaseUrl 'postgres://user:pw@host:5432/postgres' -ServiceRoleKey 'service-role-key' -TestProfileId 'uuid' -RunUpload

# Prepare environment and install deps only (no credentials needed)
.\scripts\complete-setup.ps1

# Notes:
# - If winget is available the script will try to install Node and PostgreSQL client automatically.
# - For security, supply keys via parameters or environment variables. The script will not transmit keys anywhere.
# - You must run this locally. I cannot run these commands on your machine remotely.
#>

param(
  [string]$DatabaseUrl,
  [string]$SupabaseUrl,
  [string]$AnonKey,
  [string]$ServiceRoleKey,
  [string]$TestProfileId,
  [switch]$RunUpload
)

function Write-Heading($t){ Write-Host "`n=== $t ===" -ForegroundColor Cyan }

try {
  $cwd = (Get-Location).Path
  Write-Heading "Starting complete setup"
  Write-Host "Working directory: $cwd"

  # 1) Try to auto-install Node & psql via winget if missing
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
  $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue

  if (-not $nodeCmd -and $wingetCmd) {
    Write-Heading "Installing Node.js (LTS) via winget"
    Start-Process -FilePath winget -ArgumentList 'install', '--id', 'OpenJS.Node.LTS', '-e', '--silent' -Wait -NoNewWindow
    Start-Sleep -Seconds 2
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  }

  if (-not $psqlCmd -and $wingetCmd) {
    Write-Heading "Installing PostgreSQL (psql) via winget (client tools)"
    Start-Process -FilePath winget -ArgumentList 'install', '--id', 'PostgreSQL.PostgreSQL', '-e', '--silent' -Wait -NoNewWindow
    Start-Sleep -Seconds 2
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
  }

  Write-Host "Node present:" ($nodeCmd -ne $null)
  Write-Host "psql present:" ($psqlCmd -ne $null)

  # 2) Call existing npm-fix helper
  Write-Heading "Run npm fix + install helper"
  $fixScript = Join-Path $cwd 'scripts\fix-npm-and-upload.ps1'
  if (-not (Test-Path $fixScript)) { throw "Missing helper script: $fixScript" }

  # If RunUpload is requested, pass keys; otherwise call without RunUpload
  $argsList = @()
  if ($RunUpload) { $argsList += '-RunUpload' }
  if ($SupabaseUrl) { $argsList += '-SupabaseUrl'; $argsList += $SupabaseUrl }
  if ($AnonKey) { $argsList += '-AnonKey'; $argsList += $AnonKey }
  if ($ServiceRoleKey) { $argsList += '-ServiceRoleKey'; $argsList += $ServiceRoleKey }
  if ($TestProfileId) { $argsList += '-TestProfileId'; $argsList += $TestProfileId }

  # Build argument array for direct call to helper
  $callArgs = @()
  foreach ($it in $argsList) { $callArgs += $it }
  Write-Host "Calling npm-fix helper: $fixScript $($callArgs -join ' ')"
  try {
    & $fixScript @callArgs
  } catch {
    throw "npm-fix helper failed: $_"
  }

  # 3) Apply SQL if DatabaseUrl provided and psql available
  $sqlScript = Join-Path $cwd "infra\supabase_schema.sql"
  if ($DatabaseUrl) {
    if (-not $psqlCmd) {
      Write-Heading "psql not found - can't apply SQL automatically"
      throw "psql is required to apply SQL via DatabaseUrl. Install PostgreSQL client or use Supabase Console SQL Editor."
    }

    if (-not (Test-Path $sqlScript)) {
      throw "SQL file not found: $sqlScript"
    }

    Write-Heading "Applying SQL via psql"
    # Ensure we have a string path for the SQL file
    $absSql = (Resolve-Path $sqlScript).Path
    # Build argument list explicitly as strings
    $psqlArgs = @($DatabaseUrl, "-f", $absSql)
    $proc = Start-Process -FilePath "psql" -ArgumentList $psqlArgs -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
      throw ("psql returned exit code {0}" -f $proc.ExitCode)
    }

    Write-Host "SQL applied successfully" -ForegroundColor Green
  } else {
    Write-Heading "No DatabaseUrl provided - copying SQL to clipboard"
    try {
      Set-Clipboard -Value (Get-Content $sqlScript -Raw)
      Write-Host "SQL copied to clipboard. Open Supabase Console -> SQL Editor -> New query and paste."
    } catch {
      Write-Host "Could not copy to clipboard. Open the file at $sqlScript and paste its contents into the Supabase SQL Editor." -ForegroundColor Yellow
    }
  }

  Write-Heading "All steps completed"
  Write-Host "If you provided -RunUpload and keys, upload-test already ran during the npm helper."
  exit 0
} catch {
  Write-Host "ERROR: $_" -ForegroundColor Red
  Write-Host "If automatic install failed, run the script as Administrator and ensure winget is available or install psql/Node manually."
  exit 1
}

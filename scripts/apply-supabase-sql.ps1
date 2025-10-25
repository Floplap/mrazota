<#
param(
  [string]$DatabaseUrl
)

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Prefer param, then env var
if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }

# Determine SQL file relative to this script's directory (robust when run from any CWD)
try {
  $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
  $sqlPathCandidate = Join-Path -Path (Join-Path $scriptDir '..') -ChildPath 'infra\supabase_schema.sql'
  if (-not (Test-Path -Path $sqlPathCandidate)) { throw "Cannot find file at $sqlPathCandidate" }
  $sqlPath = Resolve-Path -Path $sqlPathCandidate -ErrorAction Stop
  $sqlPath = $sqlPath.Path
} catch {
  Fail "Cannot locate infra/supabase_schema.sql relative to script. Expected at ../infra/supabase_schema.sql from script location. Error: $($_.Exception.Message)"
}

Write-Host "Found SQL at $sqlPath" -ForegroundColor Cyan

# Helper to check for psql on PATH
function Has-Psql {
  return (Get-Command psql -ErrorAction SilentlyContinue) -ne $null
}

if ($DatabaseUrl) {
  Write-Host "Using DATABASE_URL method" -ForegroundColor Cyan
  if (-not (Has-Psql)) {
    Write-Host "psql not found in PATH. Please install the PostgreSQL client tools or run the SQL in Supabase Console manually." -ForegroundColor Yellow
    Write-Host "Download psql: https://www.postgresql.org/download/ or install libpq/psql tools." -ForegroundColor Yellow
    Fail 'psql not available'
  }

  Write-Host 'psql found — applying SQL...' -ForegroundColor Green
  try {
    # Start-Process with arguments to avoid quoting issues
    $proc = Start-Process -FilePath psql -ArgumentList "$DatabaseUrl", "-f", "$sqlPath" -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) { Fail "psql returned exit code $($proc.ExitCode)" }
    Write-Host 'SQL applied successfully (psql exit code 0)' -ForegroundColor Green
    exit 0
  } catch {
    Fail "psql failed: $($_.Exception.Message)"
  }
} else {
  Write-Host 'No DATABASE_URL provided; falling back to manual copy instructions.' -ForegroundColor Yellow
  Write-Host "SQL file path: $sqlPath" -ForegroundColor Cyan
  try {
    $sqlText = Get-Content -Path $sqlPath -Raw
    Set-Clipboard -Value $sqlText
    Write-Host 'SQL copied to clipboard. Open Supabase Console -> SQL Editor and paste (Ctrl+V), then Run.' -ForegroundColor Green
  } catch {
    Write-Host 'Unable to copy to clipboard automatically. Open the SQL file and paste into Supabase Console SQL Editor:' -ForegroundColor Yellow
    Write-Host $sqlPath -ForegroundColor Cyan
  }

  Write-Host "Supabase Console SQL Editor: https://app.supabase.com/project/<PROJECT_REF>/sql" -ForegroundColor Cyan
  exit 0
}
<#/n
apply-supabase-sql.ps1

This helper attempts to apply `infra/supabase_schema.sql` to your Supabase Postgres database.
It supports two methods (choose one when running):

1) DATABASE_URL (recommended for automation):
   - Provide the Postgres connection string (DATABASE_URL) and have `psql` installed and in PATH.
   - Example:
     .\scripts\apply-supabase-sql.ps1 -DatabaseUrl 'postgres://postgres:password@db.host.supabase.co:5432/postgres'

2) Manual (no credentials):
   - If you don't provide a DatabaseUrl or don't have psql installed, the script will print exact manual steps
     (open Supabase Console > SQL Editor, paste `infra/supabase_schema.sql`, Run).

Security notes:
- If you provide a DATABASE_URL, it should be the connection string from your Supabase project (you can copy it from Settings -> Database). Keep it secret.
- The service role key is not required if you provide a direct DATABASE_URL. If you only have a service role key, prefer using the Supabase Console SQL Editor to paste the script.

/n#>

param(
  [string]$DatabaseUrl
)

function Write-Heading($t){ Write-Host "`n=== $t ===" -ForegroundColor Cyan }

try {
  $scriptPath = Join-Path -Path (Get-Location).Path -ChildPath 'infra\supabase_schema.sql'
  if (-not (Test-Path $scriptPath)) { throw "Cannot find $scriptPath" }

  Write-Heading "SQL file"
  Write-Host $scriptPath

  if ($DatabaseUrl) {
    Write-Heading "Using DATABASE_URL method"
    # check for psql
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) {
      Write-Host "psql not found in PATH. Please install PostgreSQL client tools or run the SQL in Supabase Console manually." -ForegroundColor Yellow
      Write-Host "Download psql: https://www.postgresql.org/download/ or install via psql tools in libpq"
      throw "psql not available"
    }

    Write-Host "Running psql against provided DATABASE_URL..."
    # Use temp file path
    $absSql = Resolve-Path $scriptPath
    $cmd = "psql `"$DatabaseUrl`" -f `"$absSql`""
    Write-Host "Executing: psql -f $absSql"

    $proc = Start-Process -FilePath psql -ArgumentList "`"$DatabaseUrl`"", "-f", "$absSql" -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) { throw "psql returned exit code $($proc.ExitCode)" }

    Write-Host "SQL applied successfully (psql exit code 0)" -ForegroundColor Green
    exit 0
  }

  # No DatabaseUrl provided — print manual instructions and safe copy command
  Write-Heading "No DatabaseUrl provided"
  Write-Host "I can't reach your Supabase project without credentials. To apply the SQL manually, open your Supabase project and paste the SQL file into the SQL Editor."
  Write-Host "Steps:"
  Write-Host "1) Open your Supabase project -> SQL Editor -> New query"
  Write-Host "2) Open the file: $scriptPath in a text editor and copy all contents"
  Write-Host "3) Paste into SQL Editor and click Run"
  Write-Host "Alternatively, if you can provide DATABASE_URL and have psql installed, re-run this script with -DatabaseUrl <your-db-url> to apply automatically."

  Write-Host "\nIf you want, run this (PowerShell) to copy the file contents to clipboard and open the Supabase SQL Editor URL in your browser:" -ForegroundColor Yellow
  $sqlText = Get-Content $scriptPath -Raw
  # copy to clipboard if possible
  try {
    Set-Clipboard -Value $sqlText
    Write-Host "-> SQL copied to clipboard. Now open the Supabase SQL Editor and paste (Ctrl+V)."
  } catch {
    Write-Host "(Could not copy to clipboard automatically)"
  }

  # Provide Supabase console URL hint
  Write-Host "Supabase Console SQL Editor: https://app.supabase.com/project/<PROJECT_REF>/sql" -ForegroundColor Cyan
  exit 0
} catch {
  Write-Host "ERROR: $_" -ForegroundColor Red
  exit 1
}

#!/usr/bin/env pwsh
<#
install-pg-and-run.ps1

Helper script to install 'pg' locally (safe fallbacks), prompt for
DATABASE_URL (hidden), do DNS/port checks, then run scripts/apply-sql-node.js.

Run from repository root (C:\MRAZOTA):
  PowerShell> .\scripts\install-pg-and-run.ps1
#>

Set-StrictMode -Version Latest

function Write-Ok([string]$m)  { Write-Host $m -ForegroundColor Green }
function Write-Err([string]$m) { Write-Host $m -ForegroundColor Red }
function Write-Warn([string]$m){ Write-Host $m -ForegroundColor Yellow }

try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err 'Node.js not found on PATH. Install Node.js from https://nodejs.org/'
    exit 2
  }

  if (-not (Test-Path package.json)) {
    Write-Warn 'No package.json found — creating one (npm init -y)'
    npm init -y | Out-Null
  }

  Write-Host 'Paste your Supabase DATABASE_URL (input will be hidden). Example:'
  Write-Host '  postgres://postgres:XXXXX@db-xxxxx.supabase.co:5432/postgres?sslmode=require' -ForegroundColor DarkCyan
  $secure = Read-Host -AsSecureString
  if (-not $secure) { Write-Err 'No input provided. Exiting.'; exit 3 }

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $dbUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if (-not $dbUrl) { Write-Err 'Failed to read DATABASE_URL'; exit 4 }

  # parse host into $dbHost to avoid colliding with automatic $Host
  $dbHost = $null
  if ($dbUrl -match '@(?<h>[^:/?]+)') { $dbHost = $matches['h'] }
  elseif ($dbUrl -match 'postgresql?://[^@]+@(?<h>[^:/?]+)') { $dbHost = $matches['h'] }

  if ($dbHost) {
    Write-Host "Checking DNS for: $dbHost"
    if (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue) {
      try { Resolve-DnsName $dbHost -ErrorAction Stop | Select-Object -First 5 | Format-Table -AutoSize } catch { Write-Warn "DNS lookup failed: $($_.Exception.Message)" }
    } else {
      try { nslookup $dbHost } catch { Write-Warn 'nslookup not available' }
    }

    Write-Host "Checking TCP 5432 on: $dbHost"
    try {
      $t = Test-NetConnection -ComputerName $dbHost -Port 5432 -WarningAction SilentlyContinue
      if ($t -and $t.TcpTestSucceeded) { Write-Ok 'TCP 5432 reachable' } else { Write-Warn 'TCP 5432 not reachable' }
    } catch { Write-Warn "Test-NetConnection failed: $($_.Exception.Message)" }
  } else {
    Write-Warn 'Could not parse host from DATABASE_URL; continuing.'
  }

  function Install-PgLocal {
    try { npm install pg --no-audit --no-fund --save | Out-Host; return $true } catch {}
    $userPrefix = "$env:USERPROFILE\.npm-global"
    try { npm install pg --no-audit --no-fund --prefix $userPrefix | Out-Host; return $true } catch {}
    try { npm install pg --no-audit --no-fund --prefix .\ | Out-Host; return $true } catch {}
    return $false
  }

  if (-not (Install-PgLocal)) { Write-Err 'Failed to install pg via npm. See npm output above.'; exit 10 }

  Write-Host 'Running node SQL applier...'
  try {
    & node .\scripts\apply-sql-node.js $dbUrl
    $c = $LASTEXITCODE
    if ($c -eq 0) { Write-Ok 'SQL applied.'; exit 0 } else { Write-Err "apply-sql-node.js exited $c"; exit $c }
  } catch { Write-Err "Runner failed: $($_.Exception.Message)"; exit 20 }

} catch {
  Write-Err "Unexpected error: $($_.Exception.Message)"
  exit 99
}
*** End Patch

  if (-not (Test-Path package.json)) {
    Write-Warn 'No package.json found — creating one (npm init -y)'
    npm init -y | Out-Null
  }

  Write-Host 'Paste your Supabase DATABASE_URL (hidden). Example: postgres://postgres:XXXXX@db-xxxxx.supabase.co:5432/postgres?sslmode=require'
  $secure = Read-Host -AsSecureString
  if (-not $secure) { Write-Err 'No input provided. Exiting.'; exit 3 }

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $dbUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if (-not $dbUrl) { Write-Err 'Failed to read DATABASE_URL'; exit 4 }

  # parse host
  $host = $null
  if ($dbUrl -match '@(?<h>[^:/?]+)') { $host = $matches['h'] }
  elseif ($dbUrl -match 'postgresql?://[^@]+@(?<h>[^:/?]+)') { $host = $matches['h'] }

  if ($host) {
    Write-Host "Checking DNS for: $host"
    if (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue) {
      try { Resolve-DnsName $host -ErrorAction Stop | Select-Object -First 5 } catch { Write-Warn "DNS lookup failed: $($_.Exception.Message)" }
    } else {
      try { nslookup $host } catch { Write-Warn 'nslookup not available' }
    }

    Write-Host "Checking TCP port 5432 on $host"
    try {
      $tcp = Test-NetConnection -ComputerName $host -Port 5432 -WarningAction SilentlyContinue
      if ($tcp.TcpTestSucceeded) { Write-Ok 'TCP 5432 reachable' } else { Write-Warn 'TCP 5432 not reachable' }
    } catch { Write-Warn "Test-NetConnection failed: $($_.Exception.Message)" }
  } else {
    Write-Warn 'Could not parse host from DATABASE_URL; continuing anyway.'
  }

  function Install-PgLocal {
    Write-Host 'Installing pg locally (attempt 1)...'
    try {
      npm install pg --no-audit --no-fund --save | Write-Host
      return $true
    } catch { }

    Write-Host 'Attempt 2: install with user prefix'
    $userPrefix = "$env:USERPROFILE\.npm-global"
    try { npm install pg --no-audit --no-fund --prefix $userPrefix | Write-Host; return $true } catch { }

    Write-Host 'Attempt 3: install into current folder explicitly'
    try { npm install pg --no-audit --no-fund --prefix .\ | Write-Host; return $true } catch { }

    return $false
  }

  if (-not (Install-PgLocal)) { Write-Err 'Failed to install pg via npm. Check npm output above.'; exit 10 }

  Write-Host 'Running node SQL applier...'
  try {
    & node .\scripts\apply-sql-node.js $dbUrl
    $code = $LASTEXITCODE
    if ($code -eq 0) { Write-Ok 'SQL applied successfully.'; exit 0 } else { Write-Err "apply-sql-node.js exited with code $code"; exit $code }
  } catch {
    Write-Err "Failed to run apply-sql-node.js: $($_.Exception.Message)"
    exit 20
  }
  $exit = $LASTEXITCODE
  if ($exit -eq 0) { Write-Ok "apply-sql-node.js finished successfully."; exit 0 } else { Write-Err "apply-sql-node.js exited with code $exit"; exit $exit }
} catch {
  Write-Err "Failed to run apply-sql-node.js: $($_.Exception.Message)"
  exit 20
}

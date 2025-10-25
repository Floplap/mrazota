<#
Create a safe placeholder backend/.env file.

Usage:
  # Interactive: prompts for values (you can press Enter to keep placeholder)
  pwsh -File .\backend\scripts\create-env.ps1 -Interactive

  # Non-interactive: create with placeholders (safe to commit .env.example instead)
  pwsh -File .\backend\scripts\create-env.ps1

This script DOES NOT output or log real secret values. It writes a file
`backend\.env` with placeholders you can replace locally before starting the server.
#>

param(
  [switch]$Interactive
)

function Convert-SecureStringToPlain {
  param([System.Security.SecureString]$s)
  if (-not $s) { return '' }
  $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Read-SecureInputOrPlaceholder {
  param(
    [string]$Prompt,
    [string]$Placeholder
  )
  if ($Interactive) {
    Write-Host "$Prompt (leave empty to use placeholder)" -ForegroundColor Yellow
    $secure = Read-Host -AsSecureString
    $plain = Convert-SecureStringToPlain $secure
    if (-not $plain) { return $Placeholder }
    return $plain
  } else {
    return $Placeholder
  }
}

# Determine script directory robustly (works when invoked from any CWD)
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$backendDir = Resolve-Path (Join-Path $scriptDir '..')
$envPath = Join-Path -Path $backendDir.Path -ChildPath '.env'
Write-Host "Preparing to write: $envPath" -ForegroundColor Cyan

# Default placeholders (avoid using $Host variable name)
$hostUrl = 'http://localhost:3000'
$supabaseUrl = 'https://your-project.supabase.co'
$placeholderServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE'
$placeholderAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE'
$paysProject = 'your_paysera_project_id'
$paysSign = 'your_paysera_sign_password'
$jwt = 'some-jwt-secret'

if ($Interactive) {
  Write-Host 'Interactive mode: you can paste secret values; they will not be echoed.' -ForegroundColor Green
  $tmp = Read-Host "HOST_URL (default: $hostUrl)" -ErrorAction SilentlyContinue
  if ($tmp) { $hostUrl = $tmp }
  $tmp = Read-Host "SUPABASE_URL (default: $supabaseUrl)" -ErrorAction SilentlyContinue
  if ($tmp) { $supabaseUrl = $tmp }
  $svc = Read-SecureInputOrPlaceholder 'SUPABASE_SERVICE_ROLE_KEY' $placeholderServiceKey
  $anon = Read-SecureInputOrPlaceholder 'SUPABASE_ANON_KEY' $placeholderAnonKey
  $tmp = Read-Host "PAYSERA_PROJECT_ID (default: $paysProject)" -ErrorAction SilentlyContinue
  if ($tmp) { $paysProject = $tmp }
  $paysSign = Read-SecureInputOrPlaceholder 'PAYSERA_SIGN_PASSWORD' $paysSign
  $tmp = Read-Host "JWT_SECRET (default: $jwt)" -ErrorAction SilentlyContinue
  if ($tmp) { $jwt = $tmp }
} else {
  # Non-interactive: use placeholders
  $svc = $placeholderServiceKey
  $anon = $placeholderAnonKey
}

$contents = @"
# Auto-generated backend/.env (placeholders). Replace values locally before starting the server.
SUPABASE_URL=$supabaseUrl
SUPABASE_SERVICE_ROLE_KEY=$svc
SUPABASE_ANON_KEY=$anon
PORT=5000

# Paysera placeholders
PAYSERA_PROJECT_ID=$paysProject
PAYSERA_SIGN_PASSWORD=$paysSign
PAYSERA_RETURN_URL=$hostUrl/paysera/return
PAYSERA_CANCEL_URL=$hostUrl/paysera/cancel
PAYSERA_CALLBACK_URL=$hostUrl/api/paysera/webhook

JWT_SECRET=$jwt
"@

# Write file (overwrite if exists)
Set-Content -Path $envPath -Value $contents -Encoding UTF8
Write-Host "Wrote placeholder env to $envPath" -ForegroundColor Green
Write-Host 'Now open the file and replace placeholders with your real keys. Do NOT commit the file.' -ForegroundColor Yellow

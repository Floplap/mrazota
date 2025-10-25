<#
ssh-deploy.ps1

Usage:
  .\scripts\ssh-deploy.ps1 -Host example.com -User ubuntu -KeyPath ~/.ssh/id_rsa -RemotePath /home/ubuntu/mrazota

This script will:
 - Upload local deploy.env to the remote host (to the specified remote path)
 - Pull images (if you used CI to push to a registry) or run docker compose build on the host
 - Run `docker compose --env-file deploy.env up -d --build`

Requirements on local machine:
 - scp and ssh available (OpenSSH)
 - deploy.env present in repo root

Note: do NOT put secrets in CI logs. Use SSH key with passphrase or agent.
#>

param(
  [Parameter(Mandatory=$true)][string]$Host,
  [Parameter(Mandatory=$true)][string]$User,
  [string]$KeyPath = "$HOME/.ssh/id_rsa",
  [string]$RemotePath = "/home/$env:USERNAME/mrazota",
  [int]$Port = 22,
  [switch]$PullOnly
)

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

$localEnv = Join-Path (Get-Location).Path 'deploy.env'
if (-not (Test-Path $localEnv)) { Fail "Local deploy.env not found. Create it from deploy.env.example and fill secrets." }

Write-Host "Copying deploy.env to ${User}@${Host}:${RemotePath}/deploy.env" -ForegroundColor Cyan
try {
  # Ensure remote path exists
  & ssh -i $KeyPath -p $Port $User@$Host "mkdir -p $RemotePath"
  # Copy deploy.env
  & scp -i $KeyPath -P $Port $localEnv "${User}@${Host}:${RemotePath}/deploy.env"
} catch {
  Fail "Failed to copy deploy.env: $($_.Exception.Message)"
}

if ($PullOnly) {
  Write-Host 'Running docker compose pull on remote host' -ForegroundColor Cyan
  & ssh -i $KeyPath -p $Port $User@$Host "cd $RemotePath && docker compose pull && docker compose up -d"
  exit 0
}

Write-Host 'Running docker compose up -d --build on remote host' -ForegroundColor Cyan
try {
  & ssh -i $KeyPath -p $Port $User@$Host "cd $RemotePath && docker compose --env-file deploy.env up -d --build"
} catch {
  Fail "Remote docker compose failed: $($_.Exception.Message)"
}

Write-Host 'Deployment complete. You can check logs with:' -ForegroundColor Green
Write-Host "  ssh -i $KeyPath -p $Port $User@$Host 'cd $RemotePath && docker compose logs -f'"
exit 0

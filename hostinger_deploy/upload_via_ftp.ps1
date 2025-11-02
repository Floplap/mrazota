<#
upload_via_ftp.ps1

Interactive PowerShell script to upload the local deploy zip to Hostinger via FTP.
This script does not store credentials. Run it locally on your machine where the zip exists.

Usage (PowerShell):
  .\upload_via_ftp.ps1

It will prompt for:
  - Local file to upload (default: hostinger_deploy\hostinger_final_mrazota_deploy.zip)
  - FTP host (e.g. ftp.example.hostinger.com)
  - FTP username
  - FTP password (secure prompt)
  - Remote path (e.g. /public_html/ or the app directory)

After upload, manually SSH or use Hostinger panel to unpack and run `deploy_script.sh`.
#>

param()

function Prompt-ForSecret {
    param([string]$Message)
    $secure = Read-Host -AsSecureString $Message
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

Write-Host "Hostinger FTP upload helper" -ForegroundColor Cyan

$defaultLocal = Join-Path -Path $PSScriptRoot -ChildPath 'hostinger_final_mrazota_deploy.zip'
$localPath = Read-Host "Local zip to upload (enter for default: $defaultLocal)"
if ([string]::IsNullOrWhiteSpace($localPath)) { $localPath = $defaultLocal }

if (-not (Test-Path $localPath)) {
    Write-Error "Local file not found: $localPath"; exit 2
}

$ftpHost = Read-Host "FTP host (e.g. ftp.example.hostinger.com)"
if ([string]::IsNullOrWhiteSpace($ftpHost)) { Write-Error "FTP host required"; exit 2 }

$ftpUser = Read-Host "FTP username"
if ([string]::IsNullOrWhiteSpace($ftpUser)) { Write-Error "FTP username required"; exit 2 }

$ftpPass = Prompt-ForSecret "FTP password (hidden)"

$remoteDir = Read-Host "Remote path (e.g. /public_html/)"
if ([string]::IsNullOrWhiteSpace($remoteDir)) { $remoteDir = '/' }

$fileName = [System.IO.Path]::GetFileName($localPath)
$remoteUri = "ftp://$ftpHost/$remoteDir/$fileName" -replace '//','/'

Write-Host "Uploading $localPath to $remoteUri" -ForegroundColor Yellow

try {
    $wc = New-Object System.Net.WebClient
    $wc.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    # Ensure passive mode and binary transfer by using FtpWebRequest below
    $uri = New-Object System.Uri($remoteUri)
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = $wc.Credentials
    $request.UseBinary = $true
    $request.UsePassive = $true

    $fileContents = [System.IO.File]::ReadAllBytes($localPath)
    $request.ContentLength = $fileContents.Length
    $rs = $request.GetRequestStream()
    $rs.Write($fileContents, 0, $fileContents.Length)
    $rs.Close()
    $resp = $request.GetResponse()
    Write-Host "Upload completed: $($resp.StatusDescription)" -ForegroundColor Green
    $resp.Close()
}
catch {
    Write-Error "Upload failed: $_"
    exit 3
}

Write-Host "Done. Next: SSH into the Hostinger server (or use hPanel File Manager) and unpack the zip, then run the deploy script:" -ForegroundColor Cyan
Write-Host "  unzip $fileName && bash hostinger_deploy/deploy_script.sh" -ForegroundColor White

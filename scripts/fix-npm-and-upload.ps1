<#
PowerShell helper: fix-npm-and-upload.ps1
Purpose: fix common Windows npm permission/config issues (bad prefix/tmp), install project deps, install @supabase/supabase-js, then optionally run the upload-test script.

Usage examples (PowerShell):
# 1) Dry run (shows what it will do):
.\scripts\fix-npm-and-upload.ps1 -WhatIf

# 2) Fix npm config and install deps only:
.\scripts\fix-npm-and-upload.ps1

# 3) Fix, install deps and run upload-test with anon key (no DB insert):
.\scripts\fix-npm-and-upload.ps1 -RunUpload -SupabaseUrl 'https://your.supabase.co' -AnonKey 'your-anon-key'

# 4) Fix, install deps and upload + insert post (requires service role key and TEST_PROFILE_ID):
.\scripts\fix-npm-and-upload.ps1 -RunUpload -SupabaseUrl 'https://your.supabase.co' -ServiceRoleKey 'your-service-role-key' -TestProfileId 'uuid-of-profile'
# Note: You can provide both AnonKey and ServiceRoleKey; ServiceRoleKey will be used for DB insert.

# This script must be run from a PowerShell prompt. If ExecutionPolicy prevents running, open PowerShell as Administrator and run:
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass -Force
# Then re-run this script.
#>

param(
    [switch]$RunUpload,
    [string]$SupabaseUrl,
    [string]$AnonKey,
    [string]$ServiceRoleKey,
    [string]$TestProfileId
)

function Write-Heading($text){
    Write-Host "\n=== $text ===" -ForegroundColor Cyan
}

try {
    Write-Heading "Check prerequisites"
    $node = Get-Command node -ErrorAction SilentlyContinue
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $node) { throw "Node.js is not installed or not in PATH. Install Node.js LTS from https://nodejs.org/" }
    if (-not $npm) { throw "npm is not installed or not in PATH. Node installer normally includes npm." }

    $cwd = (Get-Location).Path
    Write-Host "Working directory: $cwd"

    Write-Heading "Inspect npm config"
    $prefix = npm config get prefix
    Write-Host "npm prefix: $prefix"
    $tmp = npm config get tmp
    Write-Host "npm tmp: $tmp"

    # If prefix is root C:\ (common broken value) or empty, set to user AppData\npm
    $desiredPrefix = "$env:APPDATA\npm"
    if ($prefix -eq 'C:\' -or $prefix -eq '' -or $prefix -eq $null) {
        Write-Host "Setting npm prefix to $desiredPrefix"
        npm config set prefix "$desiredPrefix"
    } else {
        Write-Host "npm prefix OK"
    }

    # Ensure tmp is set to user temp
    if ($tmp -eq 'C:\' -or $tmp -eq '' -or $tmp -eq $null) {
        Write-Host "Setting npm tmp to $env:TEMP"
        npm config set tmp "$env:TEMP"
    } else {
        Write-Host "npm tmp OK: $tmp"
    }

    # Ensure user npm directory exists
    if (-not (Test-Path -Path $desiredPrefix)) {
        Write-Host "Creating npm user prefix folder: $desiredPrefix"
        New-Item -ItemType Directory -Force -Path $desiredPrefix | Out-Null
    }

    Write-Heading "Clear npm cache"
    npm cache clean --force

    Write-Heading "Install project dependencies (this may take a while)"
    # Run npm via cmd to avoid PowerShell shim/alias issues. Capture verbose output to a log file for debugging.
    $logFile = Join-Path -Path $cwd -ChildPath 'npm-install-verbose.txt'
    Write-Host "Running: npm install (output -> $logFile)"
    $cmd = "cmd /c npm install --verbose > `"$logFile`" 2>&1"
    $installProc = Start-Process -FilePath cmd -ArgumentList '/c', "npm install --verbose > `"$logFile`" 2>&1" -NoNewWindow -Wait -PassThru
    if ($installProc.ExitCode -ne 0) {
        Write-Host "npm install returned exit code $($installProc.ExitCode)" -ForegroundColor Yellow
        Write-Host ("Showing last 200 lines of {0} for debugging:" -f $logFile)
        try {
            Get-Content $logFile -Tail 200 | ForEach-Object { Write-Host $_ }
        } catch {
            Write-Host ("Could not read log file: {0}" -f $logFile) -ForegroundColor Yellow
        }
        throw "npm install failed. See output above or $logFile for details.";
    } else {
        Write-Host "npm install completed successfully" -ForegroundColor Green
    }

    Write-Heading "Ensure @supabase/supabase-js is installed"
    # Try to require package by checking node_modules
    $supabaseModulePath = Join-Path -Path $cwd -ChildPath 'node_modules\@supabase\supabase-js'
        if (-not (Test-Path $supabaseModulePath)) {
        Write-Host "Installing @supabase/supabase-js..."
        $installSupabaseProc = Start-Process -FilePath cmd -ArgumentList '/c', "npm install @supabase/supabase-js --save > `"$logFile`" 2>&1" -NoNewWindow -Wait -PassThru
        if ($installSupabaseProc.ExitCode -ne 0) {
            Write-Host ("Failed to install @supabase/supabase-js (exit {0})." -f $installSupabaseProc.ExitCode)
            Write-Host ("Showing last 200 lines of {0}:" -f $logFile)
            try { Get-Content $logFile -Tail 200 | ForEach-Object { Write-Host $_ } } catch {}
            throw ("Failed to install @supabase/supabase-js (exit {0})." -f $installSupabaseProc.ExitCode)
        }
    } else {
        Write-Host "@supabase/supabase-js already present"
    }

    if ($RunUpload) {
        Write-Heading "Running upload-test.js"
        if (-not $SupabaseUrl) {
            throw "RunUpload requested but -SupabaseUrl was not provided. Provide -SupabaseUrl and either -AnonKey or -ServiceRoleKey.";
        }

        if ($ServiceRoleKey) {
            $env:SUPABASE_SERVICE_ROLE_KEY = $ServiceRoleKey
            # Also set ANON if provided (optional)
            if ($AnonKey) { $env:SUPABASE_ANON_KEY = $AnonKey }
            $env:SUPABASE_URL = $SupabaseUrl
            if ($TestProfileId) { $env:TEST_PROFILE_ID = $TestProfileId }

            Write-Host "Using SUPABASE_SERVICE_ROLE_KEY and TEST_PROFILE_ID=$TestProfileId for upload+insert (service role)"
            & node .\scripts\upload-test.js
            if ($LASTEXITCODE -ne 0) { throw "upload-test.js failed with exit code $LASTEXITCODE" }
        } elseif ($AnonKey) {
            $env:SUPABASE_URL = $SupabaseUrl
            $env:SUPABASE_ANON_KEY = $AnonKey
            Write-Host "Using anon key for upload (no DB insert)."
            & node .\scripts\upload-test.js
            if ($LASTEXITCODE -ne 0) { throw "upload-test.js failed with exit code $LASTEXITCODE" }
        } else {
            throw "No key provided. Provide -AnonKey or -ServiceRoleKey to run upload-test."
        }
    } else {
        Write-Host "RunUpload not requested. Skipping upload-test.js. To run it add -RunUpload and set keys." -ForegroundColor Yellow
    }

    Write-Heading "All done"
    exit 0
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

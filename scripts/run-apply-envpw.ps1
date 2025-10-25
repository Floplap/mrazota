Param()

Set-StrictMode -Version Latest

$pw = $env:TEMP_DB_PW
if ($null -eq $pw -or $pw -eq '') {
    Write-Error 'TEMP_DB_PW environment variable is not set. Set it before running this script.'
    exit 1
}

$pwEsc = [uri]::EscapeDataString($pw)
$env:DATABASE_URL = "postgresql://postgres:$pwEsc@db.ndlmuwwznqodderoieoh.supabase.co:5432/postgres"

if (-not (Test-Path logs)) { New-Item -ItemType Directory -Path logs | Out-Null }

Write-Host 'Running apply-sql-node.js and saving output to logs\apply-sql.log'
node .\scripts\apply-sql-node.js > logs\apply-sql.log 2>&1
exit $LASTEXITCODE

Set-StrictMode -Version Latest

if ($null -ne $env:DATABASE_URL -and $env:DATABASE_URL -ne '') {
    Write-Host 'DATABASE_URL_SET'
} else {
    Write-Host 'DATABASE_URL_NOT_SET'
}

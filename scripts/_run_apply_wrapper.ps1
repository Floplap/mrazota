Write-Host 'This wrapper previously contained a plaintext password and has been disabled for security.'
Write-Host 'To run the applier, set the TEMP_DB_PW environment variable in your shell session and run run-apply-envpw.ps1 directly.'
Write-Host "Example (PowerShell):`n  $env:TEMP_DB_PW = 'your-db-password'; & '$PSScriptRoot\run-apply-envpw.ps1'"
exit 0
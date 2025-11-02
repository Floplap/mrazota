DEV_STUB (development stub) — quick guide

This backend supports a DEV_STUB mode that returns canned, helpful responses without requiring model files.

How to run (PowerShell):

# Start server with DEV_STUB enabled on port 3012
$env:DEV_STUB='true'; $env:PORT='3012'; node .\server.js

# Test the mock chat endpoint
$body = @{message='Привет'; history=@()} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3012/api/dev/mock' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 5

Notes:
- The existing /api/chat endpoint also uses the DEV_STUB when DEV_STUB=true, but will attempt to call the model runner when DEV_STUB is not set.
- The /api/dev/mock endpoint is only registered when DEV_STUB=true.
- To test real model behaviour, unset DEV_STUB and ensure models are downloaded (see run_setup.sh or repository README).

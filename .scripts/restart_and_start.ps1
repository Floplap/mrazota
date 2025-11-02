# restart_and_start.ps1
# Kills node processes holding target ports (only if they are node.exe), selects free ports,
# starts backend, Next (via npx next dev -p) and legacy (npx http-server -p), and performs health checks.

$ports = @(3002..3015) + @(3044..3090) + @(3010..3020)
$killed = @()

foreach ($p in $ports) {
    $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($c) {
        $ownPid = $c.OwningProcess
        $info = (tasklist /FI "PID eq $ownPid" /FO LIST) -join "`n"
        if ($info -match 'node.exe') {
            try {
                Write-Output ("Killing PID $ownPid that holds port $p")
                taskkill /F /PID $ownPid | Out-Null
                $killed += $ownPid
            } catch {
                Write-Output ("Failed to kill PID {0}: {1}" -f $ownPid, ($_.Exception.Message))
            }
        }
    }
}
Write-Output ("KILLED_PIDS:" + ($killed -join ','))

# choose free ports after kill
$backend = (3010..3020 | Where-Object { -not (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue) } | Select-Object -First 1)
$next = (3044..3090 | Where-Object { -not (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue) } | Select-Object -First 1)
$legacy = (3002..3015 | Where-Object { -not (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue) } | Select-Object -First 1)

Write-Output ("CHOSE_BACKEND:$backend")
Write-Output ("CHOSE_NEXT:$next")
Write-Output ("CHOSE_LEGACY:$legacy")

# Start services
if ($backend) {
    Write-Output ("Starting backend on port $backend (background)")
    # Use cmd to set PORT env and launch node so the process inherits PORT
    Start-Process -NoNewWindow -FilePath 'cmd' -ArgumentList '/c', "set PORT=$backend && cd /d F:\\MRAZOTA\\offline-ai-site\\backend && node runner_dev4.js" -WorkingDirectory 'F:\\MRAZOTA\\offline-ai-site\\backend'
} else { Write-Output "NO_FREE_BACKEND_PORT" }

if ($next) {
    Write-Output ("Starting Next via npx next dev -p $next (background)")
    Start-Process -NoNewWindow -FilePath 'cmd' -ArgumentList '/c', "cd /d F:\\MRAZOTA\\mrazota-site && npx next dev -p $next" -WorkingDirectory 'F:\\MRAZOTA\\mrazota-site'
} else { Write-Output "NO_FREE_NEXT_PORT" }

if ($legacy) {
    Write-Output ("Starting legacy static server on $legacy (background)")
    Start-Process -NoNewWindow -FilePath 'cmd' -ArgumentList '/c', "cd /d F:\\MRAZOTA\\mrazota-site\\public && npx http-server -p $legacy -a 127.0.0.1" -WorkingDirectory 'F:\\MRAZOTA\\mrazota-site\\public'
} else { Write-Output "NO_FREE_LEGACY_PORT" }

Start-Sleep -Seconds 5

# Health checks
if ($backend) {
    try { $hb = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/api/health" -f $backend) -TimeoutSec 3; Write-Output ("BACKEND_HEALTH:" + $hb.StatusCode) } catch { Write-Output 'BACKEND_HEALTH:ERR' }
}
if ($next) {
    try { $hn = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/" -f $next) -TimeoutSec 10; Write-Output ("NEXT_HEALTH:" + $hn.StatusCode) } catch { Write-Output 'NEXT_HEALTH:ERR' }
}
if ($legacy) {
    try { $hl = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/ai-tools" -f $legacy) -TimeoutSec 10; Write-Output ("LEGACY_HEALTH:" + $hl.StatusCode) } catch { Write-Output 'LEGACY_HEALTH:ERR' }
}

# Print final URLs for convenience
if ($next) { Write-Output ("NEXT_URL:http://localhost:$next") }
if ($legacy) { Write-Output ("LEGACY_URL:http://localhost:$legacy") }
if ($backend) { Write-Output ("BACKEND_URL:http://localhost:$backend") }

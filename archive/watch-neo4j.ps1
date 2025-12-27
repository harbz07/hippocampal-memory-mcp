<#
PowerShell watcher for Neo4j GraphQL server
- Reads .env for NEO4J_URI/USER/PASSWORD
- Looks for node processes running common script names
- Checks TCP port (default 4000), HTTP health, and local IPs
- Updates every $Interval seconds (default 3)
#>
param(
    [int]$Interval = 3,
    [int]$Port = 4000,
    [string]$ScriptNames = "neo4j-setup.mjs,neo4j-server.mjs,neo4j-test.mjs"
)

function Read-EnvFile {
    $result = @{}
    $envFile = Join-Path -Path $PSScriptRoot -ChildPath '.env'
    if (-not (Test-Path -Path $envFile)) { return $result }

    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^[\s#]*$') { return }
        $line = $_.Trim()
        if ($line -match '^\s*#') { return }
        if ($line -match "^\s*([^=]+)\s*=\s*(.*)$") {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim()
            # strip surrounding quotes if any
            if ($v.Length -ge 2 -and ($v.StartsWith("\"") -or $v.StartsWith("'")) -and ($v.EndsWith("\"") -or $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            $result[$k] = $v
        }
    }
    return $result
}

$scriptNamesArr = $ScriptNames -split ',' | ForEach-Object { $_.Trim() }

Write-Host "Starting Neo4j watcher (press Ctrl+C to stop). Poll interval: $Interval seconds" -ForegroundColor Cyan

while ($true) {
    Clear-Host
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Neo4j Watcher — $ts`n" -ForegroundColor Yellow

    # Env
    $envMap = Read-EnvFile
    $neoUri = $envMap.NEO4J_URI
    $neoUser = $envMap.NEO4J_USER
    $hasPassword = if ($envMap.NEO4J_PASSWORD) { '[set]' } else { '[missing]' }

    Write-Host "Neo4j DB URI: " -NoNewline; Write-Host ($neoUri ? $neoUri : '<not set>') -ForegroundColor Green
    Write-Host "Neo4j User: " -NoNewline; Write-Host ($neoUser ? $neoUser : '<not set>') -ForegroundColor Green
    Write-Host "Neo4j Password: $hasPassword`n"

    # Process check (node)
    $nodeProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Select-Object ProcessId, CommandLine
    $found = @()
    foreach ($p in $nodeProcs) {
        foreach ($s in $scriptNamesArr) {
            if ($p.CommandLine -and $p.CommandLine -like "*${s}*") {
                $found += [PSCustomObject]@{Pid=$p.ProcessId; Script=$s; CommandLine=$p.CommandLine}
            }
        }
    }

    if ($found.Count -gt 0) {
        Write-Host "GraphQL server process(es) found:" -ForegroundColor Green
        $found | ForEach-Object { Write-Host "  PID: $($_.Pid)  Script: $($_.Script)"; Write-Host "    Cmd: $($_.CommandLine)`n" -ForegroundColor DarkGray }
    }
    else {
        Write-Host "GraphQL server process: NOT FOUND" -ForegroundColor Red
    }

    # TCP/Port checks
    try {
        $net = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    } catch { $net = $null }

    if ($net) {
        Write-Host "TCP listener on port $Port: $($net.State) (Owning PID: $($net.OwningProcess))" -ForegroundColor Green
    } else {
        # Fallback to Test-NetConnection
        $tn = Test-NetConnection -ComputerName 'localhost' -Port $Port -WarningAction SilentlyContinue
        if ($tn.TcpTestSucceeded) {
            Write-Host "TCP port $Port: Open (Test-NetConnection passed)" -ForegroundColor Green
        } else {
            Write-Host "TCP port $Port: Closed/No listener" -ForegroundColor Red
        }
    }

    # HTTP check (GraphQL endpoint)
    $httpUrl = "http://localhost:${Port}/"
    $httpStatus = ''
    try {
        $resp = Invoke-WebRequest -Uri $httpUrl -Method Head -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $httpStatus = "HTTP ${($resp.StatusCode)} ${($resp.StatusDescription)}"
        Write-Host "HTTP root: $httpUrl -> $httpStatus" -ForegroundColor Green
    } catch {
        # Try full GET if HEAD fails
        try {
            $resp2 = Invoke-WebRequest -Uri $httpUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $httpStatus = "HTTP ${($resp2.StatusCode)}"
            Write-Host "HTTP root: $httpUrl -> $httpStatus" -ForegroundColor Green
        } catch {
            Write-Host "HTTP root: $httpUrl -> no response (${($_.Exception.Message)})" -ForegroundColor Red
        }
    }

    # Local IPs
    $ips = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' } | Select-Object -ExpandProperty IPAddress -Unique
    if (-not $ips) { $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' } | Select-Object -ExpandProperty IPAddress -Unique }
    Write-Host "`nLocal IP addresses:"
    if ($ips) { $ips | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan } } else { Write-Host "  <none found>" -ForegroundColor DarkGray }

    # Summary block for MCPs or other services
    Write-Host "`nSummary (useful for MCPs / service registration):" -ForegroundColor Yellow
    $graphqlHost = 'localhost'
    $graphqlPort = $Port
    $graphqlUrl = "http://$graphqlHost:$graphqlPort/"
    Write-Host "  GraphQL URL: $graphqlUrl"
    Write-Host "  GraphQL Port: $graphqlPort"
    Write-Host "  DB URI: " -NoNewline; Write-Host ($neoUri ? $neoUri : '<not set>') -ForegroundColor Green

    Start-Sleep -Seconds $Interval
}

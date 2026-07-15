$ErrorActionPreference = 'Stop'

$task = '\Panda Dashboard Server'
$healthUrl = 'http://127.0.0.1:8765/health'

function Get-ListenerPid {
  $connection = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($connection) { return [int]$connection.OwningProcess }
  return $null
}

function Wait-Health {
  param([int]$Attempts = 20)
  for ($i = 0; $i -lt $Attempts; $i += 1) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 3
      if ([int]$response.StatusCode -eq 200) { return $true }
    } catch {}
    Start-Sleep -Seconds 1
  }
  return $false
}

$beforePid = Get-ListenerPid
& schtasks.exe /End /TN $task *> $null
Start-Sleep -Seconds 1
& schtasks.exe /Run /TN $task *> $null
if ($LASTEXITCODE -ne 0) { throw 'failed to start main scheduled task' }
if (-not (Wait-Health)) { throw 'main service health check failed after restart' }
$afterPid = Get-ListenerPid

[PSCustomObject]@{
  operation = 'restart-main'
  actor = $env:DREAMERQI_OPS_ACTOR
  commit = $env:DREAMERQI_OPS_COMMIT
  runId = $env:DREAMERQI_OPS_RUN_ID
  beforePid = $beforePid
  afterPid = $afterPid
  health = 'ok'
} | ConvertTo-Json -Compress

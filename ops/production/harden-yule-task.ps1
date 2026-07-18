$ErrorActionPreference = 'Stop'

$taskName = 'Panda Yule Server'
$taskFullName = '\Panda Yule Server'
$healthUrl = 'http://127.0.0.1:8766/health'
$projectRoot = 'C:\PandaDashboard'
$desiredExecutionTimeLimit = 'PT0S'
$desiredRestartCount = 5
$desiredRestartInterval = 'PT1M'

function Test-YuleHealth {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 3
    return [int]$response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-YuleHealth {
  param([int]$Attempts = 30)
  for ($i = 0; $i -lt $Attempts; $i += 1) {
    if (Test-YuleHealth) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Read-YuleSettings {
  param($Task)
  $settings = $Task.Definition.Settings
  return [PSCustomObject]@{
    executionTimeLimit = [string]$settings.ExecutionTimeLimit
    restartCount = [int]$settings.RestartCount
    restartInterval = [string]$settings.RestartInterval
    startWhenAvailable = [bool]$settings.StartWhenAvailable
  }
}

$scheduler = New-Object -ComObject 'Schedule.Service'
$scheduler.Connect()
$taskFolder = $scheduler.GetFolder('\')
$task = $taskFolder.GetTask($taskName)
$definition = $task.Definition
$principalUserId = [string]$definition.Principal.UserId
$principalLogonType = [int]$definition.Principal.LogonType
if ($principalUserId -ne 'SYSTEM' -or $principalLogonType -ne 5) {
  throw "unexpected yule task principal: user=$principalUserId logonType=$principalLogonType"
}

$before = Read-YuleSettings -Task $task
$definition.Settings.ExecutionTimeLimit = $desiredExecutionTimeLimit
$definition.Settings.RestartCount = $desiredRestartCount
$definition.Settings.RestartInterval = $desiredRestartInterval
$definition.Settings.StartWhenAvailable = $true
$null = $taskFolder.RegisterTaskDefinition(
  $taskName,
  $definition,
  6,
  'SYSTEM',
  $null,
  5,
  $null
)

$updatedTask = $taskFolder.GetTask($taskName)
$after = Read-YuleSettings -Task $updatedTask
if ($after.executionTimeLimit -ne $desiredExecutionTimeLimit) { throw 'yule execution time limit update failed' }
if ($after.restartCount -ne $desiredRestartCount) { throw 'yule restart count update failed' }
if ($after.restartInterval -ne $desiredRestartInterval) { throw 'yule restart interval update failed' }
if (-not $after.startWhenAvailable) { throw 'yule start-when-available update failed' }

$restarted = $false
if (-not (Test-YuleHealth)) {
  & schtasks.exe /Run /TN $taskFullName *> $null
  if ($LASTEXITCODE -ne 0) { throw 'failed to start yule scheduled task after hardening' }
  $restarted = $true
}
if (-not (Wait-YuleHealth)) { throw 'yule service health check failed after hardening' }

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
$line = "`r`n- $timestamp GitHub production run $($env:DREAMERQI_OPS_RUN_ID) actor=$($env:DREAMERQI_OPS_ACTOR) operation=harden-yule-task executionTimeLimit=$($after.executionTimeLimit) restartCount=$($after.restartCount) restartInterval=$($after.restartInterval) startWhenAvailable=$($after.startWhenAvailable) restarted=$restarted health=ok`r`n"
$utf8 = [System.Text.UTF8Encoding]::new($false)
foreach ($logName in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $logPath = Join-Path $projectRoot $logName
  if (Test-Path -LiteralPath $logPath) { [System.IO.File]::AppendAllText($logPath, $line, $utf8) }
}

[PSCustomObject]@{
  operation = 'harden-yule-task'
  actor = $env:DREAMERQI_OPS_ACTOR
  commit = $env:DREAMERQI_OPS_COMMIT
  runId = $env:DREAMERQI_OPS_RUN_ID
  principal = [PSCustomObject]@{
    userId = $principalUserId
    logonType = $principalLogonType
  }
  before = $before
  after = $after
  restarted = $restarted
  health = 'ok'
} | ConvertTo-Json -Depth 5 -Compress

$ErrorActionPreference = 'Stop'

$taskPath = '\'
$taskName = 'Panda Yule Server'
$taskFullName = '\Panda Yule Server'
$healthUrl = 'http://127.0.0.1:8766/health'
$projectRoot = 'C:\PandaDashboard'

function Get-ListenerPid {
  $connection = Get-NetTCPConnection -LocalPort 8766 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($connection) { return [int]$connection.OwningProcess }
  return $null
}

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

$task = Get-ScheduledTask -TaskPath $taskPath -TaskName $taskName
$beforeInfo = Get-ScheduledTaskInfo -TaskPath $taskPath -TaskName $taskName
$beforeTaskState = [string]$task.State
$beforePid = Get-ListenerPid
$beforeHealthy = Test-YuleHealth
$actions = @($task.Actions | ForEach-Object {
  [PSCustomObject]@{
    execute = [string]$_.Execute
    arguments = [string]$_.Arguments
    workingDirectory = [string]$_.WorkingDirectory
  }
})
$settings = [PSCustomObject]@{
  restartCount = [int]$task.Settings.RestartCount
  restartInterval = [string]$task.Settings.RestartInterval
  executionTimeLimit = [string]$task.Settings.ExecutionTimeLimit
  multipleInstances = [string]$task.Settings.MultipleInstances
  startWhenAvailable = [bool]$task.Settings.StartWhenAvailable
}

& schtasks.exe /End /TN $taskFullName *> $null
Start-Sleep -Seconds 1
& schtasks.exe /Run /TN $taskFullName *> $null
if ($LASTEXITCODE -ne 0) { throw 'failed to start yule scheduled task' }
if (-not (Wait-YuleHealth)) { throw 'yule service health check failed after restart' }

$afterInfo = Get-ScheduledTaskInfo -TaskPath $taskPath -TaskName $taskName
$afterTask = Get-ScheduledTask -TaskPath $taskPath -TaskName $taskName
$afterPid = Get-ListenerPid
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
$line = "`r`n- $timestamp GitHub production run $($env:DREAMERQI_OPS_RUN_ID) actor=$($env:DREAMERQI_OPS_ACTOR) operation=restart-yule beforeState=$beforeTaskState beforeResult=$($beforeInfo.LastTaskResult) beforePid=$beforePid afterPid=$afterPid health=ok`r`n"
$utf8 = [System.Text.UTF8Encoding]::new($false)
foreach ($logName in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $logPath = Join-Path $projectRoot $logName
  if (Test-Path -LiteralPath $logPath) { [System.IO.File]::AppendAllText($logPath, $line, $utf8) }
}

[PSCustomObject]@{
  operation = 'restart-yule'
  actor = $env:DREAMERQI_OPS_ACTOR
  commit = $env:DREAMERQI_OPS_COMMIT
  runId = $env:DREAMERQI_OPS_RUN_ID
  before = [PSCustomObject]@{
    taskState = $beforeTaskState
    lastRunTime = $beforeInfo.LastRunTime
    lastTaskResult = [int64]$beforeInfo.LastTaskResult
    listenerPid = $beforePid
    healthy = $beforeHealthy
  }
  actions = $actions
  settings = $settings
  after = [PSCustomObject]@{
    taskState = [string]$afterTask.State
    lastRunTime = $afterInfo.LastRunTime
    lastTaskResult = [int64]$afterInfo.LastTaskResult
    listenerPid = $afterPid
    healthy = $true
  }
} | ConvertTo-Json -Depth 6 -Compress

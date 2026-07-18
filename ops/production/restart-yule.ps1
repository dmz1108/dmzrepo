$ErrorActionPreference = 'Stop'

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

function Convert-TaskState {
  param([int]$State)
  switch ($State) {
    0 { return 'unknown' }
    1 { return 'disabled' }
    2 { return 'queued' }
    3 { return 'ready' }
    4 { return 'running' }
    default { return "state-$State" }
  }
}

$scheduler = New-Object -ComObject 'Schedule.Service'
$scheduler.Connect()
$taskFolder = $scheduler.GetFolder('\')

function Get-YuleTask {
  try {
    return $taskFolder.GetTask($taskName)
  } catch {
    throw "scheduled task not found: $taskName"
  }
}

$task = Get-YuleTask
$beforeTaskState = Convert-TaskState -State ([int]$task.State)
$beforeLastRunTime = $task.LastRunTime
$beforeLastTaskResult = [int64]$task.LastTaskResult
$beforePid = Get-ListenerPid
$beforeHealthy = Test-YuleHealth
$definition = $task.Definition
$actions = @()
for ($i = 1; $i -le $definition.Actions.Count; $i += 1) {
  $action = $definition.Actions.Item($i)
  $actions += [PSCustomObject]@{
    execute = [string]$action.Path
    arguments = [string]$action.Arguments
    workingDirectory = [string]$action.WorkingDirectory
  }
}
$settings = [PSCustomObject]@{
  restartCount = [int]$definition.Settings.RestartCount
  restartInterval = [string]$definition.Settings.RestartInterval
  executionTimeLimit = [string]$definition.Settings.ExecutionTimeLimit
  multipleInstances = [int]$definition.Settings.MultipleInstances
  startWhenAvailable = [bool]$definition.Settings.StartWhenAvailable
}

& schtasks.exe /End /TN $taskFullName *> $null
Start-Sleep -Seconds 1
& schtasks.exe /Run /TN $taskFullName *> $null
if ($LASTEXITCODE -ne 0) { throw 'failed to start yule scheduled task' }
if (-not (Wait-YuleHealth)) { throw 'yule service health check failed after restart' }

$afterTask = Get-YuleTask
$afterPid = Get-ListenerPid
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
$line = "`r`n- $timestamp GitHub production run $($env:DREAMERQI_OPS_RUN_ID) actor=$($env:DREAMERQI_OPS_ACTOR) operation=restart-yule beforeState=$beforeTaskState beforeResult=$beforeLastTaskResult beforePid=$beforePid afterPid=$afterPid health=ok`r`n"
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
    lastRunTime = $beforeLastRunTime
    lastTaskResult = $beforeLastTaskResult
    listenerPid = $beforePid
    healthy = $beforeHealthy
  }
  actions = $actions
  settings = $settings
  after = [PSCustomObject]@{
    taskState = Convert-TaskState -State ([int]$afterTask.State)
    lastRunTime = $afterTask.LastRunTime
    lastTaskResult = [int64]$afterTask.LastTaskResult
    listenerPid = $afterPid
    healthy = $true
  }
} | ConvertTo-Json -Depth 6 -Compress

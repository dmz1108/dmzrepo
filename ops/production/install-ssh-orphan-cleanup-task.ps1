$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$projectRoot = 'C:\PandaDashboard'
$runtimeScript = Join-Path $projectRoot 'ops\cleanup-orphaned-ssh-preauth.ps1'
$statusPath = Join-Path $projectRoot 'ops\ssh-orphan-cleanup-status.json'
$taskName = 'Panda SSH Orphan Cleanup'
$taskFullName = "\$taskName"
$runId = [string]$env:DREAMERQI_OPS_RUN_ID
$stamp = Get-Date -Format 'yyyyMMddTHHmmss'
$backupRoot = Join-Path $projectRoot ("_deploy-backups\ssh-orphan-task-$stamp-$runId")
$backupXmlPath = Join-Path $backupRoot 'task.xml'
$powershellPath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$taskCommand = (
  "`"$powershellPath`" -NoProfile -NonInteractive -ExecutionPolicy Bypass " +
  "-File `"$runtimeScript`""
)
$utf8 = [System.Text.UTF8Encoding]::new($false)

if (-not (Test-Path -LiteralPath $runtimeScript -PathType Leaf)) {
  throw 'runtime cleanup script is missing'
}

$tokens = $null
$parseErrors = $null
$null = [System.Management.Automation.Language.Parser]::ParseFile(
  $runtimeScript,
  [ref]$tokens,
  [ref]$parseErrors
)
if (@($parseErrors).Count -gt 0) {
  throw ('runtime cleanup script has syntax errors: ' + (($parseErrors | ForEach-Object Message) -join '; '))
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$hadExistingTask = $false
$existingXml = @(& schtasks.exe /Query /TN $taskFullName /XML 2>$null)
if ($LASTEXITCODE -eq 0 -and $existingXml.Count -gt 0) {
  $hadExistingTask = $true
  [System.IO.File]::WriteAllLines($backupXmlPath, $existingXml, $utf8)
}

$initialOutput = @(& $powershellPath -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $runtimeScript)
if ($LASTEXITCODE -ne 0) {
  throw 'initial orphan cleanup failed'
}
$initialStatus = Get-Content -LiteralPath $statusPath -Raw -Encoding UTF8 | ConvertFrom-Json

try {
  & schtasks.exe /Create /TN $taskFullName /SC MINUTE /MO 5 /TR $taskCommand /RU SYSTEM /RL HIGHEST /F *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'failed to create SSH orphan cleanup task'
  }

  $scheduler = New-Object -ComObject 'Schedule.Service'
  $scheduler.Connect()
  $task = $scheduler.GetFolder('\').GetTask($taskName)
  $definition = $task.Definition
  $principal = [string]$definition.Principal.UserId
  $interval = [string]$definition.Triggers.Item(1).Repetition.Interval
  $action = $definition.Actions.Item(1)
  if ($principal -notin @('SYSTEM', 'S-1-5-18')) {
    throw "unexpected task principal: $principal"
  }
  if ($interval -ne 'PT5M') {
    throw "unexpected task interval: $interval"
  }
  if ([string]$action.Arguments -notlike "*$runtimeScript*") {
    throw 'task action does not reference the approved runtime script'
  }

  $beforeRun = if (Test-Path -LiteralPath $statusPath) {
    (Get-Item -LiteralPath $statusPath).LastWriteTimeUtc
  } else {
    [datetime]::MinValue
  }
  & schtasks.exe /Run /TN $taskFullName *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'failed to start SSH orphan cleanup task'
  }

  $taskRan = $false
  for ($attempt = 1; $attempt -le 20; $attempt += 1) {
    Start-Sleep -Seconds 1
    if ((Test-Path -LiteralPath $statusPath) -and
        (Get-Item -LiteralPath $statusPath).LastWriteTimeUtc -gt $beforeRun) {
      $taskRan = $true
      break
    }
  }
  if (-not $taskRan) {
    throw 'scheduled cleanup did not update its status file'
  }
} catch {
  $failure = $_
  if ($hadExistingTask -and (Test-Path -LiteralPath $backupXmlPath)) {
    & schtasks.exe /Create /TN $taskFullName /XML $backupXmlPath /F *> $null
  } else {
    & schtasks.exe /Delete /TN $taskFullName /F *> $null
  }
  throw "SSH orphan cleanup task installation failed and task registration was rolled back: $failure"
}

$finalStatus = Get-Content -LiteralPath $statusPath -Raw -Encoding UTF8 | ConvertFrom-Json
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
$line = (
  "`r`n- $timestamp GitHub production run $runId actor=$($env:DREAMERQI_OPS_ACTOR) " +
  "commit=$($env:DREAMERQI_OPS_COMMIT) operation=install-ssh-orphan-cleanup " +
  "interval=PT5M minimumAgeSeconds=60 initialKilled=$($initialStatus.killed) " +
  "remaining=$($finalStatus.remainingOrphans) principal=SYSTEM status=ok " +
  "backup=$backupRoot`r`n"
)
foreach ($logName in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $logPath = Join-Path $projectRoot $logName
  if (Test-Path -LiteralPath $logPath) {
    [System.IO.File]::AppendAllText($logPath, $line, $utf8)
  }
}

[PSCustomObject]@{
  operation = 'install-ssh-orphan-cleanup'
  taskName = $taskFullName
  principal = $principal
  interval = $interval
  initial = $initialStatus
  final = $finalStatus
  backup = $backupRoot
} | ConvertTo-Json -Depth 5 -Compress

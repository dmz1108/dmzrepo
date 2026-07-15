$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\PandaDashboard'
$runId = [string]$env:DREAMERQI_OPS_RUN_ID
$archive = [string]$env:DREAMERQI_OPS_SOURCE_ARCHIVE
$manifestRelative = [string]$env:DREAMERQI_OPS_MANIFEST_PATH
$stagingRoot = Join-Path $env:TEMP ("dreamerqi-source-$runId")
$backupRoot = Join-Path $projectRoot ("_deploy-backups\github-$runId")
$taskMap = @{
  none = ''
  main = '\Panda Dashboard Server'
  yule = '\Panda Yule Server'
  caddy = '\Panda Caddy HTTPS'
  consistency = '\Panda Consistency Gate'
}
$healthMap = @{
  none = ''
  main = 'http://127.0.0.1:8765/health'
  yule = 'http://127.0.0.1:8766/health'
  caddy = 'https://market.dreamerqi.com/health'
  consistency = ''
}

function Resolve-SafeRelativePath {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$Relative
  )
  if ([System.IO.Path]::IsPathRooted($Relative) -or $Relative -match '(^|[\\/])\.\.([\\/]|$)') {
    throw "unsafe relative path: $Relative"
  }
  $baseFull = [System.IO.Path]::GetFullPath($Base).TrimEnd('\') + '\'
  $full = [System.IO.Path]::GetFullPath((Join-Path $Base $Relative))
  if (-not $full.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "path escapes base: $Relative"
  }
  return $full
}

function Wait-Health {
  param([string]$Url, [int]$Attempts = 20)
  if (-not $Url) { return $true }
  for ($i = 0; $i -lt $Attempts; $i += 1) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ([int]$response.StatusCode -eq 200) { return $true }
    } catch {}
    Start-Sleep -Seconds 1
  }
  return $false
}

if (-not (Test-Path -LiteralPath $archive)) { throw 'source archive is missing' }
if (-not $manifestRelative) { throw 'manifest_path is required for deploy-from-main' }
if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force }
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null
Expand-Archive -LiteralPath $archive -DestinationPath $stagingRoot -Force

$manifestPath = Resolve-SafeRelativePath -Base $stagingRoot -Relative $manifestRelative
if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'manifest is not present in approved source archive' }
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$files = @($manifest.files)
if ($files.Count -lt 1 -or $files.Count -gt 50) { throw 'manifest files must contain 1-50 entries' }
$restart = [string]$manifest.restart
if (-not $taskMap.ContainsKey($restart)) { throw "unsupported restart target: $restart" }

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$records = @()
$task = $taskMap[$restart]
$healthUrl = $healthMap[$restart]
$taskStopped = $false
$deploymentStarted = $false
$destinationKeys = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

try {
  foreach ($file in $files) {
    $sourceRelative = [string]$file.source
    $destinationRelative = [string]$file.destination
    if ([string]::IsNullOrWhiteSpace($sourceRelative) -or [string]::IsNullOrWhiteSpace($destinationRelative)) {
      throw 'manifest source and destination paths must not be empty'
    }
    if (-not $destinationKeys.Add($destinationRelative)) {
      throw "duplicate manifest destination: $destinationRelative"
    }
    $sourcePath = Resolve-SafeRelativePath -Base $stagingRoot -Relative $sourceRelative
    $destinationPath = Resolve-SafeRelativePath -Base $projectRoot -Relative $destinationRelative
    $backupPath = Resolve-SafeRelativePath -Base $backupRoot -Relative $destinationRelative
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { throw "source file missing: $sourceRelative" }
    $destinationDirectory = Split-Path -Parent $destinationPath
    $backupDirectory = Split-Path -Parent $backupPath
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    $existed = Test-Path -LiteralPath $destinationPath -PathType Leaf
    if ($existed) { Copy-Item -LiteralPath $destinationPath -Destination $backupPath -Force }
    $tempPath = "$destinationPath.github-$runId.tmp"
    Copy-Item -LiteralPath $sourcePath -Destination $tempPath -Force
    if ([System.IO.Path]::GetExtension($destinationPath) -ieq '.js') {
      & node --check $tempPath
      if ($LASTEXITCODE -ne 0) { throw "node syntax check failed: $destinationRelative" }
    }
    $records += [PSCustomObject]@{
      source = $sourceRelative
      destination = $destinationRelative
      destinationPath = $destinationPath
      backupPath = $backupPath
      tempPath = $tempPath
      existed = $existed
      expectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash
    }
  }

  $deploymentStarted = $true
  if ($task) {
    & schtasks.exe /End /TN $task *> $null
    Start-Sleep -Seconds 1
    $taskStopped = $true
  }

  foreach ($record in $records) {
    Move-Item -LiteralPath $record.tempPath -Destination $record.destinationPath -Force
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $record.destinationPath).Hash
    if ($actualHash -ne $record.expectedHash) { throw "deployed hash mismatch: $($record.destination)" }
  }

  if ($task) {
    & schtasks.exe /Run /TN $task *> $null
    if ($LASTEXITCODE -ne 0) { throw "failed to start task: $task" }
    $taskStopped = $false
  }
  if (-not (Wait-Health -Url $healthUrl)) { throw "health check failed: $healthUrl" }

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
  $fileList = ($records | ForEach-Object { $_.destination }) -join ', '
  $line = "`r`n- $timestamp GitHub production run $runId actor=$($env:DREAMERQI_OPS_ACTOR) commit=$($env:DREAMERQI_OPS_COMMIT) files=[$fileList] restart=$restart health=ok backup=$backupRoot`r`n"
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  foreach ($logName in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
    $logPath = Join-Path $projectRoot $logName
    if (Test-Path -LiteralPath $logPath) { [System.IO.File]::AppendAllText($logPath, $line, $utf8) }
  }

  [PSCustomObject]@{
    operation = 'deploy-from-main'
    actor = $env:DREAMERQI_OPS_ACTOR
    commit = $env:DREAMERQI_OPS_COMMIT
    runId = $runId
    files = @($records | ForEach-Object { $_.destination })
    restart = $restart
    health = 'ok'
    backup = $backupRoot
  } | ConvertTo-Json -Compress
} catch {
  if ($deploymentStarted -and $task) {
    & schtasks.exe /End /TN $task *> $null
    Start-Sleep -Seconds 1
    $taskStopped = $true
  }
  foreach ($record in $records) {
    if (Test-Path -LiteralPath $record.tempPath) { Remove-Item -LiteralPath $record.tempPath -Force }
    if ($record.existed -and (Test-Path -LiteralPath $record.backupPath)) {
      Copy-Item -LiteralPath $record.backupPath -Destination $record.destinationPath -Force
    } elseif (-not $record.existed -and (Test-Path -LiteralPath $record.destinationPath)) {
      Remove-Item -LiteralPath $record.destinationPath -Force
    }
  }
  if ($deploymentStarted -and $task -and ($taskStopped -or $records.Count -gt 0)) {
    & schtasks.exe /Run /TN $task *> $null
    Wait-Health -Url $healthUrl | Out-Null
  }
  throw
} finally {
  if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force }
}

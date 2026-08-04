$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\PandaDashboard'
$runId = [string]$env:DREAMERQI_OPS_RUN_ID
$archive = [string]$env:DREAMERQI_OPS_SOURCE_ARCHIVE
$manifestRelative = [string]$env:DREAMERQI_OPS_MANIFEST_PATH
$stagingRoot = Join-Path $env:TEMP ("dreamerqi-pr382-diagnose-$runId")
$probeStdout = Join-Path $env:TEMP ("dreamerqi-pr382-$runId.stdout.log")
$probeStderr = Join-Path $env:TEMP ("dreamerqi-pr382-$runId.stderr.log")
$probeProcess = $null
$oldPort = [Environment]::GetEnvironmentVariable('KPL_STATS_PORT', 'Process')
$oldHost = [Environment]::GetEnvironmentVariable('KPL_STATS_HOST', 'Process')
$oldPublicPort = [Environment]::GetEnvironmentVariable('KPL_PUBLIC_HTTP_PORT', 'Process')

function Get-FileSha256 {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-HealthProbe {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return [PSCustomObject]@{
      ok = [int]$response.StatusCode -eq 200
      statusCode = [int]$response.StatusCode
      body = [string]$response.Content
    }
  } catch {
    return [PSCustomObject]@{
      ok = $false
      statusCode = $null
      body = 'request-failed'
    }
  }
}

function Get-SafeLogTail {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return '' }
  $text = Get-Content -LiteralPath $Path -Raw -ErrorAction SilentlyContinue
  if ($null -eq $text) { $text = '' }
  $text = [string]$text
  $text = $text.Replace($projectRoot, '[project]').Replace($env:TEMP, '[temp]')
  $text = $text -replace '(?i)(token|password|cookie|api[_-]?key)\s*[:=]\s*\S+', '$1=[redacted]'
  if ($text.Length -gt 4000) { $text = $text.Substring($text.Length - 4000) }
  return $text
}

function Restore-ProcessEnvironment {
  if ($null -eq $oldPort) { Remove-Item Env:KPL_STATS_PORT -ErrorAction SilentlyContinue } else { $env:KPL_STATS_PORT = $oldPort }
  if ($null -eq $oldHost) { Remove-Item Env:KPL_STATS_HOST -ErrorAction SilentlyContinue } else { $env:KPL_STATS_HOST = $oldHost }
  if ($null -eq $oldPublicPort) { Remove-Item Env:KPL_PUBLIC_HTTP_PORT -ErrorAction SilentlyContinue } else { $env:KPL_PUBLIC_HTTP_PORT = $oldPublicPort }
}

if (-not $runId) { throw 'DREAMERQI_OPS_RUN_ID is required' }
if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) { throw 'approved source archive is missing' }
if (-not $manifestRelative) { throw 'manifest path is required' }
if (Test-Path -LiteralPath $stagingRoot) { throw 'diagnostic staging path already exists' }
if (Get-NetTCPConnection -LocalPort 18765 -State Listen -ErrorAction SilentlyContinue) {
  throw 'diagnostic loopback port is already in use'
}

try {
  New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null
  Expand-Archive -LiteralPath $archive -DestinationPath $stagingRoot -Force
  $manifestPath = Join-Path $stagingRoot $manifestRelative
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'approved manifest is missing from archive' }
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

  $dependencies = @()
  foreach ($item in @($manifest.files)) {
    $relative = [string]$item.source
    if (-not $relative -or [System.IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)') {
      throw "unsafe manifest source: $relative"
    }
    $approvedPath = Join-Path $stagingRoot $relative
    $productionPath = Join-Path $projectRoot $relative
    $approvedHash = Get-FileSha256 -Path $approvedPath
    if (-not $approvedHash) { throw "approved source missing: $relative" }
    $productionHash = Get-FileSha256 -Path $productionPath
    $dependencies += [PSCustomObject]@{
      file = $relative
      approvedSha256 = $approvedHash
      productionSha256 = $productionHash
      matches = [bool]($productionHash -and $productionHash -eq $approvedHash)
    }
  }

  $taskInfo = Get-ScheduledTaskInfo -TaskName 'Panda Dashboard Server' -ErrorAction SilentlyContinue
  $task = Get-ScheduledTask -TaskName 'Panda Dashboard Server' -ErrorAction SilentlyContinue
  $listener = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  $productionHealth = Get-HealthProbe -Url 'http://127.0.0.1:8765/health'

  $env:KPL_STATS_PORT = '18765'
  $env:KPL_STATS_HOST = '127.0.0.1'
  $env:KPL_PUBLIC_HTTP_PORT = '0'
  $probeProcess = Start-Process -FilePath 'node' -ArgumentList @('kpl-stats-server.js') -WorkingDirectory $stagingRoot `
    -RedirectStandardOutput $probeStdout -RedirectStandardError $probeStderr -PassThru -WindowStyle Hidden

  $probeHealth = $null
  for ($i = 0; $i -lt 20; $i += 1) {
    Start-Sleep -Milliseconds 150
    $probeProcess.Refresh()
    if ($probeProcess.HasExited) { break }
    $candidate = Get-HealthProbe -Url 'http://127.0.0.1:18765/health'
    if ($candidate.ok) { $probeHealth = $candidate; break }
  }
  if (-not $probeHealth) { $probeHealth = Get-HealthProbe -Url 'http://127.0.0.1:18765/health' }

  $probeProcess.Refresh()
  $probeExited = $probeProcess.HasExited
  $probeExitCode = if ($probeExited) { $probeProcess.ExitCode } else { $null }
  if (-not $probeExited) {
    Stop-Process -Id $probeProcess.Id -Force -ErrorAction SilentlyContinue
    $probeProcess.WaitForExit(5000) | Out-Null
  }

  [PSCustomObject]@{
    operation = 'pr382-startup-diagnose'
    commit = [string]$env:DREAMERQI_OPS_COMMIT
    productionHealth = $productionHealth
    productionListenerPid = if ($listener) { [int]$listener.OwningProcess } else { $null }
    scheduledTask = if ($task) { [PSCustomObject]@{
      state = [string]$task.State
      lastRunTime = if ($taskInfo) { $taskInfo.LastRunTime.ToString('o') } else { $null }
      lastTaskResult = if ($taskInfo) { [int]$taskInfo.LastTaskResult } else { $null }
    } } else { $null }
    dependencyMatches = $dependencies
    probe = [PSCustomObject]@{
      healthy = [bool]$probeHealth.ok
      statusCode = $probeHealth.statusCode
      exitedBeforeCleanup = [bool]$probeExited
      exitCode = $probeExitCode
      stdout = Get-SafeLogTail -Path $probeStdout
      stderr = Get-SafeLogTail -Path $probeStderr
    }
  } | ConvertTo-Json -Depth 6 -Compress
} finally {
  if ($probeProcess) {
    try {
      $probeProcess.Refresh()
      if (-not $probeProcess.HasExited) { Stop-Process -Id $probeProcess.Id -Force -ErrorAction SilentlyContinue }
    } catch {}
  }
  Restore-ProcessEnvironment
  foreach ($path in @($probeStdout, $probeStderr)) {
    if ($path -and (Test-Path -LiteralPath $path)) { Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue }
  }
  if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue }
}

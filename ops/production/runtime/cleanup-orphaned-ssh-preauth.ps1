$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$projectRoot = 'C:\PandaDashboard'
$statusPath = Join-Path $projectRoot 'ops\ssh-orphan-cleanup-status.json'
$minimumAgeSeconds = 60
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Get-OrphanedUnauthenticatedChildren {
  $allSshd = @(Get-CimInstance Win32_Process -Filter "Name='sshd.exe'")
  $allProcesses = @(Get-CimInstance Win32_Process)
  $knownPids = [System.Collections.Generic.HashSet[int]]::new()
  foreach ($process in $allProcesses) {
    $null = $knownPids.Add([int]$process.ProcessId)
  }

  return @($allSshd | Where-Object {
    [string]$_.CommandLine -match '(?:^|\s)-y(?:\s|$)' -and
    -not $knownPids.Contains([int]$_.ParentProcessId)
  })
}

function Get-ProcessAgeSeconds {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) { return $null }
  return [math]::Floor(((Get-Date) - $process.StartTime).TotalSeconds)
}

$service = Get-CimInstance Win32_Service -Filter "Name='sshd'"
if (-not $service -or $service.State -ne 'Running') {
  throw 'sshd service is not running'
}
$listeners = @(Get-NetTCPConnection -State Listen -OwningProcess ([int]$service.ProcessId) -ErrorAction SilentlyContinue)
if ($listeners.Count -lt 1) {
  throw 'sshd service has no listening socket'
}

$candidates = @(Get-OrphanedUnauthenticatedChildren)
$killed = 0
$skippedYoung = 0
$skippedChanged = 0

foreach ($candidate in $candidates) {
  $candidatePid = [int]$candidate.ProcessId
  $ageSeconds = Get-ProcessAgeSeconds -ProcessId $candidatePid
  if ($null -eq $ageSeconds) {
    $skippedChanged += 1
    continue
  }
  if ($ageSeconds -lt $minimumAgeSeconds) {
    $skippedYoung += 1
    continue
  }

  $current = Get-CimInstance Win32_Process -Filter "ProcessId=$candidatePid" -ErrorAction SilentlyContinue
  if (-not $current -or
      $current.Name -ne 'sshd.exe' -or
      [string]$current.CommandLine -notmatch '(?:^|\s)-y(?:\s|$)' -or
      (Get-Process -Id ([int]$current.ParentProcessId) -ErrorAction SilentlyContinue)) {
    $skippedChanged += 1
    continue
  }

  try {
    Stop-Process -Id $candidatePid -Force -ErrorAction Stop
    $killed += 1
  } catch {
    if (Get-Process -Id $candidatePid -ErrorAction SilentlyContinue) {
      throw
    }
    $skippedChanged += 1
  }
}

Start-Sleep -Milliseconds 500
$remaining = @(Get-OrphanedUnauthenticatedChildren)
$status = [PSCustomObject]@{
  operation = 'cleanup-orphaned-ssh-preauth'
  collectedAt = (Get-Date).ToString('o')
  minimumAgeSeconds = $minimumAgeSeconds
  examined = $candidates.Count
  killed = $killed
  skippedYoung = $skippedYoung
  skippedChanged = $skippedChanged
  remainingOrphans = $remaining.Count
  serviceStatus = [string](Get-Service -Name sshd).Status
  listenerCount = $listeners.Count
}

$statusDirectory = Split-Path -Parent $statusPath
New-Item -ItemType Directory -Path $statusDirectory -Force | Out-Null
$temporaryStatus = "$statusPath.tmp"
[System.IO.File]::WriteAllText(
  $temporaryStatus,
  ($status | ConvertTo-Json -Depth 4),
  $utf8
)
Move-Item -LiteralPath $temporaryStatus -Destination $statusPath -Force
$status | ConvertTo-Json -Depth 4 -Compress

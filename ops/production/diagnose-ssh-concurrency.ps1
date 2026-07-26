$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$configPath = Join-Path $env:ProgramData 'ssh\sshd_config'
$sshdPath = Join-Path $env:WINDIR 'System32\OpenSSH\sshd.exe'
$eventLog = 'OpenSSH/Operational'
$since = (Get-Date).AddMinutes(-15)

if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
  throw 'sshd_config is missing'
}
if (-not (Test-Path -LiteralPath $sshdPath -PathType Leaf)) {
  throw 'sshd.exe is missing'
}

$effectiveLines = @(& $sshdPath -T -f $configPath 2>&1)
if ($LASTEXITCODE -ne 0) {
  throw ('sshd effective-config validation failed: ' + ($effectiveLines -join ' '))
}

$wanted = @(
  'port',
  'passwordauthentication',
  'pubkeyauthentication',
  'kbdinteractiveauthentication',
  'logingracetime',
  'maxauthtries',
  'maxsessions',
  'maxstartups',
  'persourcemaxstartups'
)
$settings = [ordered]@{}
foreach ($line in $effectiveLines) {
  $text = [string]$line
  if ($text -notmatch '^\s*([a-z0-9]+)\s+(.+?)\s*$') { continue }
  $key = $Matches[1].ToLowerInvariant()
  if ($wanted -notcontains $key) { continue }
  $settings[$key] = $Matches[2]
}

$port = 22
if ($settings.Contains('port')) {
  $parsedPort = 0
  if ([int]::TryParse([string]$settings.port, [ref]$parsedPort)) {
    $port = $parsedPort
  }
}

$connections = @(Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue)
$connectionStates = [ordered]@{}
foreach ($group in @($connections | Group-Object State | Sort-Object Name)) {
  $connectionStates[[string]$group.Name] = [int]$group.Count
}
$remoteConnections = @($connections | Where-Object {
  $_.RemoteAddress -and $_.RemoteAddress -notin @('0.0.0.0', '::')
})
$remoteGroups = @($remoteConnections | Group-Object RemoteAddress)
$maxConnectionsFromOneSource = 0
if ($remoteGroups.Count) {
  $maxConnectionsFromOneSource = [int](($remoteGroups | Measure-Object Count -Maximum).Maximum)
}

$events = @()
if (Get-WinEvent -ListLog $eventLog -ErrorAction SilentlyContinue) {
  $events = @(Get-WinEvent -FilterHashtable @{
    LogName = $eventLog
    StartTime = $since
  } -ErrorAction SilentlyContinue)
}
$authFailureEvents = @($events | Where-Object {
  $_.Message -match '(?i)failed|invalid user|authentication failure|maximum authentication attempts'
}).Count
$startupDropEvents = @($events | Where-Object {
  $_.Message -match '(?i)maxstartups|drop connection|connection reset'
}).Count

$service = Get-Service -Name sshd -ErrorAction Stop
$processes = @(Get-Process -Name sshd -ErrorAction SilentlyContinue)
$allProcessDetails = @(Get-CimInstance Win32_Process)
$knownPids = [System.Collections.Generic.HashSet[int]]::new()
foreach ($process in $allProcessDetails) {
  $null = $knownPids.Add([int]$process.ProcessId)
}
$sshdProcessDetails = @($allProcessDetails | Where-Object { $_.Name -eq 'sshd.exe' })
$unauthenticatedChildren = @($sshdProcessDetails | Where-Object {
  [string]$_.CommandLine -match '(?:^|\s)-y(?:\s|$)'
})
$authenticatedChildren = @($sshdProcessDetails | Where-Object {
  [string]$_.CommandLine -match '(?:^|\s)-z(?:\s|$)'
})
$reexecChildren = @($sshdProcessDetails | Where-Object {
  [string]$_.CommandLine -match '(?:^|\s)-R(?:\s|$)'
})
$orphanedUnauthenticatedChildren = @($unauthenticatedChildren | Where-Object {
  -not $knownPids.Contains([int]$_.ParentProcessId)
})
$versionInfo = (Get-Item -LiteralPath $sshdPath).VersionInfo
$versionText = [string]$versionInfo.FileVersion
if (-not $versionText) {
  $versionText = [string]$versionInfo.ProductVersion
}

[PSCustomObject]@{
  operation = 'diagnose-ssh-concurrency'
  collectedAt = (Get-Date).ToString('o')
  readOnly = $true
  configPath = $configPath
  configSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash
  sshdVersion = $versionText.Trim()
  serviceStatus = [string]$service.Status
  sshdProcessCount = $processes.Count
  processSummary = [PSCustomObject]@{
    unauthenticatedChildren = $unauthenticatedChildren.Count
    authenticatedChildren = $authenticatedChildren.Count
    reexecChildren = $reexecChildren.Count
    orphanedUnauthenticatedChildren = $orphanedUnauthenticatedChildren.Count
  }
  effectiveSettings = $settings
  connectionSummary = [PSCustomObject]@{
    port = $port
    total = $connections.Count
    byState = $connectionStates
    uniqueRemoteSources = $remoteGroups.Count
    maxConnectionsFromOneSource = $maxConnectionsFromOneSource
  }
  recentEventSummary = [PSCustomObject]@{
    windowMinutes = 15
    total = $events.Count
    authenticationFailures = $authFailureEvents
    startupDropsOrResets = $startupDropEvents
  }
} | ConvertTo-Json -Depth 6 -Compress

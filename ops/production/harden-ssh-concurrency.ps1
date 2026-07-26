$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$projectRoot = 'C:\PandaDashboard'
$configPath = Join-Path $env:ProgramData 'ssh\sshd_config'
$sshdPath = Join-Path $env:WINDIR 'System32\OpenSSH\sshd.exe'
$runId = [string]$env:DREAMERQI_OPS_RUN_ID
$stamp = Get-Date -Format 'yyyyMMddTHHmmss'
$backupRoot = Join-Path $projectRoot ("_deploy-backups\ssh-hardening-$stamp-$runId")
$backupPath = Join-Path $backupRoot 'sshd_config'
$candidatePath = Join-Path $env:TEMP ("dreamerqi-sshd-config-$runId")
$utf8 = [System.Text.UTF8Encoding]::new($false)

$managedDirectives = [ordered]@{
  LoginGraceTime = '20'
  MaxAuthTries = '3'
  MaxStartups = '20:30:60'
  PerSourceMaxStartups = '3'
  KbdInteractiveAuthentication = 'no'
}
$expectedSettings = [ordered]@{
  logingracetime = '20'
  maxauthtries = '3'
  maxstartups = '20:30:60'
  persourcemaxstartups = '3'
  kbdinteractiveauthentication = 'no'
}

function Get-EffectiveSshdSettings {
  param([Parameter(Mandatory = $true)][string]$Path)

  $effectiveLines = @(& $script:sshdPath -T -f $Path 2>&1)
  if ($LASTEXITCODE -ne 0) {
    throw ('sshd effective-config validation failed: ' + ($effectiveLines -join ' '))
  }

  $settings = [ordered]@{}
  foreach ($line in $effectiveLines) {
    $text = [string]$line
    if ($text -notmatch '^\s*([a-z0-9]+)\s+(.+?)\s*$') { continue }
    $settings[$Matches[1].ToLowerInvariant()] = $Matches[2]
  }
  return $settings
}

function Assert-ExpectedSettings {
  param(
    [Parameter(Mandatory = $true)]$Settings,
    [Parameter(Mandatory = $true)][string]$Stage
  )

  foreach ($entry in $script:expectedSettings.GetEnumerator()) {
    if (-not $Settings.Contains($entry.Key)) {
      throw "$Stage effective config is missing $($entry.Key)"
    }
    if ([string]$Settings[$entry.Key] -ne [string]$entry.Value) {
      throw "$Stage effective config mismatch for $($entry.Key)"
    }
  }
}

function Test-ExpectedSettings {
  param([Parameter(Mandatory = $true)]$Settings)

  foreach ($entry in $script:expectedSettings.GetEnumerator()) {
    if (-not $Settings.Contains($entry.Key) -or
        [string]$Settings[$entry.Key] -ne [string]$entry.Value) {
      return $false
    }
  }
  return $true
}

function Wait-SshdReady {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$Attempts = 20
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt += 1) {
    $service = Get-Service -Name sshd -ErrorAction SilentlyContinue
    $listener = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    if ($service -and $service.Status -eq 'Running' -and $listener.Count -gt 0) {
      return $true
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Write-CloudLog {
  param([Parameter(Mandatory = $true)][string]$Line)

  foreach ($logName in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
    $logPath = Join-Path $script:projectRoot $logName
    if (Test-Path -LiteralPath $logPath) {
      [System.IO.File]::AppendAllText($logPath, $Line, $script:utf8)
    }
  }
}

if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
  throw 'sshd_config is missing'
}
if (-not (Test-Path -LiteralPath $sshdPath -PathType Leaf)) {
  throw 'sshd.exe is missing'
}

$beforeSettings = Get-EffectiveSshdSettings -Path $configPath
$port = 0
if (-not $beforeSettings.Contains('port') -or
    -not [int]::TryParse([string]$beforeSettings.port, [ref]$port)) {
  throw 'effective SSH port is invalid'
}

$listener = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1)
$listenerStartedAfterConfig = $false
if ($listener.Count -gt 0) {
  $listenerProcess = Get-Process -Id $listener[0].OwningProcess -ErrorAction SilentlyContinue
  if ($listenerProcess) {
    $listenerStartedAfterConfig = (
      $listenerProcess.StartTime.ToUniversalTime() -ge
      (Get-Item -LiteralPath $configPath).LastWriteTimeUtc
    )
  }
}
if ((Test-ExpectedSettings -Settings $beforeSettings) -and $listenerStartedAfterConfig) {
  $currentHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash
  $currentProcesses = @(Get-Process -Name sshd -ErrorAction SilentlyContinue).Count
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
  $line = (
    "`r`n- $timestamp GitHub production run $runId actor=$($env:DREAMERQI_OPS_ACTOR) " +
    "commit=$($env:DREAMERQI_OPS_COMMIT) operation=ssh-concurrency-hardening " +
    "changed=false reason=already-applied configHash=$currentHash " +
    "processes=$currentProcesses service=running listener=ok`r`n"
  )
  Write-CloudLog -Line $line
  [PSCustomObject]@{
    operation = 'harden-ssh-concurrency'
    changed = $false
    reason = 'already-applied'
    serviceStatus = [string](Get-Service -Name sshd).Status
    listener = $true
    configSha256 = $currentHash
    processCount = $currentProcesses
    effectiveSettings = [PSCustomObject]@{
      loginGraceTime = [string]$beforeSettings.logingracetime
      maxAuthTries = [string]$beforeSettings.maxauthtries
      maxStartups = [string]$beforeSettings.maxstartups
      perSourceMaxStartups = [string]$beforeSettings.persourcemaxstartups
      keyboardInteractiveAuthentication = [string]$beforeSettings.kbdinteractiveauthentication
      passwordAuthentication = [string]$beforeSettings.passwordauthentication
      pubkeyAuthentication = [string]$beforeSettings.pubkeyauthentication
    }
  } | ConvertTo-Json -Depth 4 -Compress
  return
}

$originalBytes = [System.IO.File]::ReadAllBytes($configPath)
$originalLines = [System.IO.File]::ReadAllLines($configPath, [System.Text.Encoding]::UTF8)
$globalLines = [System.Collections.Generic.List[string]]::new()
$matchLines = [System.Collections.Generic.List[string]]::new()
$insideMatch = $false
$managedPattern = '^\s*(?:LoginGraceTime|MaxAuthTries|MaxStartups|PerSourceMaxStartups|KbdInteractiveAuthentication)\s+'

foreach ($line in $originalLines) {
  if (-not $insideMatch -and $line -match '^\s*Match(?:\s|$)') {
    $insideMatch = $true
  }
  if ($insideMatch) {
    $matchLines.Add($line)
  } elseif ($line -notmatch $managedPattern) {
    $globalLines.Add($line)
  }
}

$candidateLines = [System.Collections.Generic.List[string]]::new()
foreach ($line in $globalLines) { $candidateLines.Add($line) }
$candidateLines.Add('')
$candidateLines.Add('# DreamerQi managed SSH concurrency hardening')
foreach ($entry in $managedDirectives.GetEnumerator()) {
  $candidateLines.Add("$($entry.Key) $($entry.Value)")
}
if ($matchLines.Count -gt 0) {
  $candidateLines.Add('')
  foreach ($line in $matchLines) { $candidateLines.Add($line) }
}

try {
  [System.IO.File]::WriteAllLines($candidatePath, $candidateLines, $utf8)
  $candidateSettings = Get-EffectiveSshdSettings -Path $candidatePath
  Assert-ExpectedSettings -Settings $candidateSettings -Stage 'candidate'

  foreach ($preservedKey in @('port', 'pubkeyauthentication', 'passwordauthentication')) {
    if ($beforeSettings.Contains($preservedKey) -and
        [string]$candidateSettings[$preservedKey] -ne [string]$beforeSettings[$preservedKey]) {
      throw "candidate unexpectedly changes $preservedKey"
    }
  }

  & $sshdPath -t -f $candidatePath
  if ($LASTEXITCODE -ne 0) {
    throw 'sshd candidate syntax validation failed'
  }
} catch {
  if (Test-Path -LiteralPath $candidatePath) {
    Remove-Item -LiteralPath $candidatePath -Force
  }
  throw
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
Copy-Item -LiteralPath $configPath -Destination $backupPath -Force
$beforeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash
$processCountBefore = @(Get-Process -Name sshd -ErrorAction SilentlyContinue).Count
$configWritten = $false
$rolledBack = $false

try {
  [System.IO.File]::WriteAllBytes(
    $configPath,
    [System.IO.File]::ReadAllBytes($candidatePath)
  )
  $configWritten = $true

  & $sshdPath -t -f $configPath
  if ($LASTEXITCODE -ne 0) {
    throw 'deployed sshd_config syntax validation failed'
  }

  Restart-Service -Name sshd -Force -ErrorAction Stop
  if (-not (Wait-SshdReady -Port $port)) {
    throw 'sshd did not return to a running/listening state'
  }

  $afterSettings = Get-EffectiveSshdSettings -Path $configPath
  Assert-ExpectedSettings -Settings $afterSettings -Stage 'deployed'

  foreach ($preservedKey in @('port', 'pubkeyauthentication', 'passwordauthentication')) {
    if ($beforeSettings.Contains($preservedKey) -and
        [string]$afterSettings[$preservedKey] -ne [string]$beforeSettings[$preservedKey]) {
      throw "deployed config unexpectedly changes $preservedKey"
    }
  }
} catch {
  $failure = $_
  if ($configWritten) {
    [System.IO.File]::WriteAllBytes($configPath, $originalBytes)
    $rolledBack = $true
    & $sshdPath -t -f $configPath
    if ($LASTEXITCODE -ne 0) {
      throw "SSH hardening failed and rollback config validation failed: $failure"
    }
    Restart-Service -Name sshd -Force -ErrorAction Stop
    if (-not (Wait-SshdReady -Port $port)) {
      throw "SSH hardening failed and rollback did not restore the listener: $failure"
    }
  }
  throw "SSH hardening failed; rollback=$rolledBack; error=$failure"
} finally {
  if (Test-Path -LiteralPath $candidatePath) {
    Remove-Item -LiteralPath $candidatePath -Force
  }
}

$afterHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash
$processCountAfter = @(Get-Process -Name sshd -ErrorAction SilentlyContinue).Count
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'
$line = (
  "`r`n- $timestamp GitHub production run $runId actor=$($env:DREAMERQI_OPS_ACTOR) " +
  "commit=$($env:DREAMERQI_OPS_COMMIT) operation=ssh-concurrency-hardening " +
  "LoginGraceTime=20 MaxAuthTries=3 MaxStartups=20:30:60 " +
  "PerSourceMaxStartups=3 KbdInteractiveAuthentication=no " +
  "configHash=$beforeHash->$afterHash processes=$processCountBefore->$processCountAfter " +
  "backup=$backupRoot service=running listener=ok`r`n"
)
Write-CloudLog -Line $line

[PSCustomObject]@{
  operation = 'harden-ssh-concurrency'
  changed = $true
  serviceStatus = [string](Get-Service -Name sshd).Status
  listener = $true
  configSha256Before = $beforeHash
  configSha256After = $afterHash
  backup = $backupRoot
  processCountBefore = $processCountBefore
  processCountAfter = $processCountAfter
  effectiveSettings = [PSCustomObject]@{
    loginGraceTime = [string]$afterSettings.logingracetime
    maxAuthTries = [string]$afterSettings.maxauthtries
    maxStartups = [string]$afterSettings.maxstartups
    perSourceMaxStartups = [string]$afterSettings.persourcemaxstartups
    keyboardInteractiveAuthentication = [string]$afterSettings.kbdinteractiveauthentication
    passwordAuthentication = [string]$afterSettings.passwordauthentication
    pubkeyAuthentication = [string]$afterSettings.pubkeyauthentication
  }
} | ConvertTo-Json -Depth 4 -Compress

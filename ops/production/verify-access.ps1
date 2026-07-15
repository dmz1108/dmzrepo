$ErrorActionPreference = 'Stop'

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [System.Security.Principal.WindowsPrincipal]::new($identity)
$project = 'C:\PandaDashboard'
$probe = Join-Path $project ('.github-production-probe-' + [Guid]::NewGuid().ToString('N') + '.tmp')

[System.IO.File]::WriteAllText($probe, 'permission-check', [System.Text.UTF8Encoding]::new($false))
$writeOk = (Test-Path -LiteralPath $probe) -and ((Get-Content -LiteralPath $probe -Raw) -eq 'permission-check')
Remove-Item -LiteralPath $probe -Force

& schtasks.exe /Query /TN '\Panda Dashboard Server' /FO LIST *> $null
$taskQueryOk = $LASTEXITCODE -eq 0

$runtimeDirs = @(
  'kpl-limitup-main-reason-sources',
  'kpl-limitup-main-reason-db',
  'strategy-data'
)
$readableRuntimeDirs = @($runtimeDirs | Where-Object { Test-Path -LiteralPath (Join-Path $project $_) })

[PSCustomObject]@{
  operation = 'verify-access'
  actor = $env:DREAMERQI_OPS_ACTOR
  commit = $env:DREAMERQI_OPS_COMMIT
  runId = $env:DREAMERQI_OPS_RUN_ID
  scriptSha256 = $env:DREAMERQI_OPS_SCRIPT_SHA256
  user = $identity.Name
  isAdministrator = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
  projectExists = Test-Path -LiteralPath $project
  projectWriteAndDelete = $writeOk
  mainScheduledTaskVisible = $taskQueryOk
  runtimeDataDirsReadable = $readableRuntimeDirs.Count
  nodeAvailable = [bool](Get-Command node -ErrorAction SilentlyContinue)
} | ConvertTo-Json -Compress

# DreamerQi production operation: record the blocked 2026-09-01 TGB Hunan
# daily review after the official article was not found during the protected
# raw-evidence force refresh.
#
# This request is log-only. It validates the article-not-found raw manifest and
# absence of a formal TGB file. It backs up both cloud logs before appending an
# idempotent safe record. It never writes formal rows, rebuilds the combined
# database, invokes OCR/Qwen/vision, or restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-09-01'
$rawManifestFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-09-01\manifest.json'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-09-01.json'
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$logHeading = '## 2026-09-01 - tgb-hunan-article-not-found-blocked'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-blocked-20260901-' + $stamp)

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Raw evidence manifest is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write blocker.' }

$manifest = Get-Content -LiteralPath $rawManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }
if ([string]$manifest.status -ne 'article-not-found') { throw ('Unexpected raw status: ' + [string]$manifest.status) }
$articles = @($manifest.articles)
if ($articles.Count -ne 0) { throw ('Unexpected article count: ' + $articles.Count) }

$logFiles = @()
$missingHeadingFiles = @()
foreach ($name in $logNames) {
  $file = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $file)) { throw ('Cloud operation log is missing: ' + $name) }
  $logFiles += $file
  $existing = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  if ($existing.IndexOf($logHeading, [System.StringComparison]::Ordinal) -lt 0) {
    $missingHeadingFiles += $file
  }
}

$backupCreated = $false
if ($missingHeadingFiles.Count -gt 0) {
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  foreach ($file in $logFiles) {
    Copy-Item -LiteralPath $file -Destination (Join-Path $backupDir ([System.IO.Path]::GetFileName($file))) -Force
  }
  $backupCreated = $true
}

$logEntry = @(
  ''
  $logHeading
  ('- Actor: ' + $env:DREAMERQI_OPS_ACTOR)
  ('- Commit: ' + $env:DREAMERQI_OPS_COMMIT)
  ('- Run: ' + $env:DREAMERQI_OPS_RUN_ID)
  '- Raw evidence force-refresh run: 33465213095'
  ('- Target day: ' + $day + ' (China time; trading day, pre-close at request time)')
  ('- Raw manifest status: ' + [string]$manifest.status + '; official articles=0; downloaded images=0')
  '- Blocker: the official @TGB Hunan daily review article and official table image were not yet published.'
  '- Formal structured TGB rows: not written'
  '- Terminal-pool reconciliation: not started because no official image exists'
  '- Combined main-reason database rebuilt: no'
  '- Service restart: none'
  ''
) -join "`r`n"

foreach ($file in $missingHeadingFiles) {
  [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-article-not-found-blocked-log'
  day = $day
  rawEvidenceRun = '33465213095'
  rawStatus = [string]$manifest.status
  articleCount = 0
  downloadedImageCount = 0
  backupDir = $(if ($backupCreated) { $backupDir } else { '' })
  logsUpdated = @($missingHeadingFiles | ForEach-Object { [System.IO.Path]::GetFileName($_) })
  formalRowsWritten = $false
  reconciliationStarted = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

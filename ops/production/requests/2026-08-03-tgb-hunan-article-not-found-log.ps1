# DreamerQi production operation: record the blocked 2026-08-03 TGB Hunan
# daily review after the protected raw-evidence refresh found no official article.
#
# This request is log-only. It validates the same-day raw manifest, the eligible
# terminal pool, and the absence of a formal TGB file. It backs up both cloud
# logs before appending an idempotent safe record. It never writes formal rows,
# rebuilds the combined database, or restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-08-03'
$rawManifestFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-08-03\manifest.json'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-08-03.json'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-08-03.json'
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$logHeading = '## 2026-08-03 - tgb-hunan-official-article-not-found'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-blocked-20260803-' + $stamp)
$retiredMarker = [string][char]0x9000

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Raw evidence manifest is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write blocker.' }
if (-not (Test-Path -LiteralPath $baselineFile)) { throw 'Same-day terminal limit-up pool is missing.' }

$manifest = Get-Content -LiteralPath $rawManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }
if ([string]$manifest.status -ne 'article-not-found') { throw ('Unexpected raw evidence status: ' + [string]$manifest.status) }
if (@($manifest.articles).Count -ne 0) { throw 'Article-not-found manifest unexpectedly contains articles.' }

$baseline = Get-Content -LiteralPath $baselineFile -Raw -Encoding UTF8 | ConvertFrom-Json
$baselineRows = @($baseline.stocks)
$eligibleRows = @($baselineRows | Where-Object {
  $code = [string]$_.code
  $name = [string]$_.name
  ($code -notmatch '^[489]') -and
    ($name -notmatch '(?i)\*?ST') -and
    ($name.IndexOf($retiredMarker, [System.StringComparison]::Ordinal) -lt 0) -and
    ($name -notmatch '(?i)^[NC]')
})
$eligibleCodes = @($eligibleRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
if ($eligibleRows.Count -ne 75 -or $eligibleCodes.Count -ne 75) {
  throw ('Unexpected review-eligible terminal pool: rows=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
}
$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()

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
  '- Protected force refresh completed the raw-only collector for the target day, but the official article was not found.'
  '- Official article: unavailable; raw manifest status article-not-found; article count 0; downloaded image count 0.'
  ('- Review-eligible terminal pool: 75 rows, 75 unique codes; code-set SHA-256 ' + $codeSetSha256 + '.')
  '- Manual image transcription: not started because no official image evidence exists.'
  '- Formal structured TGB rows: not written'
  '- Combined main-reason database rebuilt: no'
  '- Public source-view remains TGB absent; the other three formal sources and combined database each report 75 stocks.'
  '- Service restart: none'
  ''
) -join "`r`n"

foreach ($file in $missingHeadingFiles) {
  [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-official-article-not-found'
  day = $day
  rawStatus = [string]$manifest.status
  articleCount = @($manifest.articles).Count
  downloadedImageCount = 0
  rawBaselineCount = $baselineRows.Count
  eligibleBaselineCount = $eligibleRows.Count
  eligibleUniqueCount = $eligibleCodes.Count
  eligibleCodeSetSha256 = $codeSetSha256
  backupDir = $(if ($backupCreated) { $backupDir } else { '' })
  logsUpdated = @($missingHeadingFiles | ForEach-Object { [System.IO.Path]::GetFileName($_) })
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

# Date-bound, raw-only @TGB Hunan evidence refresh for 2026-09-23.
# No OCR, vision, formal rows, combined-reason rebuild, or service restart.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$project = 'C:\PandaDashboard'
$day = '2026-09-23'
$rawRoot = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw'
$rawDir = Join-Path $rawRoot $day
$priorDir = Join-Path $rawRoot '2026-09-22'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-09-23.json'
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-raw-20260923-' + $stamp)
$requiredTitle = -join @([char]0x6E56, [char]0x5357, [char]0x4EBA, [char]0x6DA8, [char]0x505C, [char]0x590D, [char]0x76D8)

if (-not (Test-Path -LiteralPath (Join-Path $project 'kpl-stats-server.js'))) { throw 'Production server entry is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal file already exists; stop before refresh.' }
foreach ($name in $logNames) {
  if (-not (Test-Path -LiteralPath (Join-Path $project $name))) { throw ('Cloud log missing: ' + $name) }
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
if (Test-Path -LiteralPath $rawDir) { Copy-Item -LiteralPath $rawDir -Destination (Join-Path $backupDir $day) -Recurse -Force }
# The CLI uses a trading-day window. Back up the prior trading day in case
# its upstream calendar has not included Wednesday yet; the day check then stops.
if (Test-Path -LiteralPath $priorDir) { Copy-Item -LiteralPath $priorDir -Destination (Join-Path $backupDir '2026-09-22') -Recurse -Force }
foreach ($name in $logNames) {
  Copy-Item -LiteralPath (Join-Path $project $name) -Destination (Join-Path $backupDir $name) -Force
}

Push-Location $project
try {
  $output = & node '.\kpl-stats-server.js' '--tgb-hunan-raw-evidence' ('--day=' + $day) '--days=1' '--force' | Out-String
  if ($LASTEXITCODE -ne 0) { throw ('Raw-only command exited with ' + $LASTEXITCODE) }
} finally { Pop-Location }

$run = $output | ConvertFrom-Json
if ($run.mode -ne 'tgb-hunan-raw-evidence' -or $run.endDay -ne $day -or
    $run.force -ne $true -or $run.ocrDisabled -ne $true -or
    $run.manualRequired -ne $true -or $run.automaticStructuringDisabled -ne $true -or
    $run.officialTgbOnly -ne $true -or @($run.results).Count -ne 1 -or
    $run.results[0].day -ne $day) {
  throw 'Raw-only CLI flags or target day mismatch; inspect backed-up prior day before any further action.'
}

$manifestFile = Join-Path $rawDir 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestFile)) { throw 'Target raw manifest missing.' }
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ($manifest.day -ne $day -or $manifest.source -ne 'review/tgb-hunan-raw') { throw 'Raw manifest identity mismatch.' }
$articles = @($manifest.articles | Where-Object { $null -ne $_ })
$sourceErrors = @($manifest.sourceErrors | Where-Object { $null -ne $_ })
$imageCount = 0
if ($articles.Count -eq 0) {
  if ($manifest.status -ne 'article-not-found') { throw 'Unexpected empty raw manifest status.' }
  $outcome = if ($sourceErrors.Count -gt 0) { 'source-fetch-error' } else { 'article-not-found' }
} else {
  if ($manifest.status -ne 'raw-evidence-saved') { throw 'Unexpected article-bearing raw manifest status.' }
  $outcome = 'raw-evidence-saved'
  foreach ($article in $articles) {
    if ([string]$article.url -notmatch '^https://www\.tgb\.cn/a/' -or
        -not ([string]$article.title).StartsWith('9.23', [System.StringComparison]::Ordinal) -or
        ([string]$article.title).IndexOf($requiredTitle, [System.StringComparison]::Ordinal) -lt 0) { throw 'Official article URL/title/day mismatch.' }
    $imageCount += @($article.images | Where-Object { $_.saved -eq $true -and -not $_.error }).Count
  }
  if ($imageCount -eq 0) { $outcome = 'image-download-failed' }
}
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file appeared during raw refresh.' }

$logEntry = @(
  ''
  ('## 2026-09-23 - tgb-hunan-raw-evidence-' + $stamp)
  ('- Target day: ' + $day + ' China time; raw-only force refresh')
  ('- Outcome: ' + $outcome + '; official articles=' + $articles.Count + '; downloaded images=' + $imageCount + '; source errors=' + $sourceErrors.Count)
  ('- Raw backup: ' + $backupDir)
  '- Formal TGB rows: unchanged; no reconciliation or combined-reason rebuild'
  '- Application deploy and service restart: none'
  ''
) -join "`r`n"
foreach ($name in $logNames) {
  [System.IO.File]::AppendAllText((Join-Path $project $name), $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  day = $day
  outcome = $outcome
  backupDir = $backupDir
  manifestFile = $manifestFile
  articleCount = $articles.Count
  downloadedImageCount = $imageCount
  sourceErrorCount = $sourceErrors.Count
  articles = @($articles | ForEach-Object { [PSCustomObject]@{ url = [string]$_.url; title = [string]$_.title; files = @($_.images | Where-Object { $_.saved -eq $true } | ForEach-Object { [string]$_.file }) } })
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 6

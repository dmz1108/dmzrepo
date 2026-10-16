# DreamerQi production operation: force-refresh official @TGB Hunan raw evidence.
#
# Scope:
# - target trading day: 2026-10-16 (China time), after market close
# - back up the existing raw-evidence directory and both cloud logs
# - run the raw-only server command with --force
# - validate and print only safe article/image metadata
# - append one safe operation receipt to both cloud logs
#
# This script never invokes OCR/Qwen/vision, never writes formal structured TGB
# rows, never rebuilds the combined reason database, and never restarts services.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-10-16'
$rawRoot = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw'
$rawDir = Join-Path $rawRoot $day
$manifestFile = Join-Path $rawDir 'manifest.json'
$formalFile = Join-Path $project ('kpl-limitup-main-reason-sources\tgb-hunan-structured\' + $day + '.json')
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-raw-' + $day.Replace('-', '') + '-' + $stamp)
$requiredDayTitle = '10.16'
$requiredTitle = -join @(
  [char]0x6E56,
  [char]0x5357,
  [char]0x4EBA,
  [char]0x6DA8,
  [char]0x505C,
  [char]0x590D,
  [char]0x76D8
)
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')

if (-not (Test-Path -LiteralPath (Join-Path $project 'kpl-stats-server.js'))) {
  throw 'Production server entry file is missing.'
}
if (Test-Path -LiteralPath $formalFile) {
  throw 'Formal TGB file already exists; raw-only refresh stopped for manual review.'
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$backupRawPresent = $false
if (Test-Path -LiteralPath $rawDir) {
  Copy-Item -LiteralPath $rawDir -Destination (Join-Path $backupDir $day) -Recurse -Force
  $backupRawPresent = $true
}
foreach ($name in $logNames) {
  $logPath = Join-Path $project $name
  if (Test-Path -LiteralPath $logPath) {
    Copy-Item -LiteralPath $logPath -Destination (Join-Path $backupDir $name) -Force
  }
}

Push-Location $project
try {
  & node '.\kpl-stats-server.js' '--tgb-hunan-raw-evidence' ('--day=' + $day) '--days=1' '--force'
  if ($LASTEXITCODE -ne 0) { throw ('raw evidence command exited with ' + $LASTEXITCODE) }
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $manifestFile)) {
  throw 'Raw evidence manifest was not created.'
}

$manifestText = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8
$manifest = $manifestText | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }

$articles = @($manifest.articles)
$safeArticles = @()
$downloadedCount = 0
foreach ($article in $articles) {
  $articleUrl = [string]$article.url
  $articleTitle = [string]$article.title
  if ($articleUrl -notmatch '^https://www\.tgb\.cn/a/') { throw ('Unexpected article URL: ' + $articleUrl) }
  if (-not $articleTitle.StartsWith($requiredDayTitle, [System.StringComparison]::Ordinal)) {
    throw ('Article title does not start with target date: ' + $articleTitle)
  }
  if ($articleTitle.IndexOf($requiredTitle, [System.StringComparison]::Ordinal) -lt 0) {
    throw ('Unexpected article title: ' + $articleTitle)
  }
  $safeImages = @()
  foreach ($image in @($article.images)) {
    if ($image.saved -eq $true -and -not [string]$image.error) { $downloadedCount += 1 }
    $safeImages += [PSCustomObject]@{
      file = [string]$image.file
      url = [string]$image.url
      saved = [bool]$image.saved
      length = [int64]$image.length
      error = [string]$image.error
    }
  }
  $safeArticles += [PSCustomObject]@{
    url = $articleUrl
    title = $articleTitle
    htmlFile = [string]$article.htmlFile
    images = $safeImages
  }
}

$status = [string]$manifest.status
if ($status -eq 'raw-evidence-saved') {
  if ($articles.Count -lt 1) { throw 'No official TGB article was saved.' }
  if ($downloadedCount -lt 1) { throw 'No official TGB image was downloaded.' }
} elseif ($status -eq 'article-not-found') {
  if ($articles.Count -ne 0 -or $downloadedCount -ne 0) {
    throw 'Article-not-found manifest unexpectedly contains article/image evidence.'
  }
} else {
  throw ('Unexpected raw status: ' + $status)
}

$manifestSha = (Get-FileHash -LiteralPath $manifestFile -Algorithm SHA256).Hash.ToLowerInvariant()
$completedAt = (Get-Date).ToUniversalTime().ToString('o')
$receiptKey = 'tgb-hunan-raw-evidence-aftermarket-' + $day + '-' + $manifestSha.Substring(0, 16)
$logEntry = @(
  ''
  ('## ' + $day + ' - tgb-hunan-raw-evidence-aftermarket')
  ('- Receipt: ' + $receiptKey)
  ('- Forced official TGB raw-only refresh; status=' + $status + '; official articles=' + $articles.Count + '; downloaded images=' + $downloadedCount + '.')
  ('- Raw/log backup: ' + $backupDir + '; prior raw present=' + $backupRawPresent + '.')
  ('- Manifest SHA-256: ' + $manifestSha)
  '- OCR/Qwen/automatic vision: disabled; formal rows: unchanged'
  '- Combined main-reason database: unchanged'
  '- Application deployment: none; service restart: none'
  ''
) -join "`r`n"

foreach ($name in $logNames) {
  $logPath = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $logPath)) { throw ('Cloud log missing: ' + $name) }
  $existing = Get-Content -LiteralPath $logPath -Raw -Encoding UTF8
  if ($existing.IndexOf($receiptKey, [System.StringComparison]::Ordinal) -lt 0) {
    [System.IO.File]::AppendAllText($logPath, $logEntry, [System.Text.UTF8Encoding]::new($false))
  }
}

$receiptCounts = @{}
foreach ($name in $logNames) {
  $text = Get-Content -LiteralPath (Join-Path $project $name) -Raw -Encoding UTF8
  $receiptCounts[$name] = ([regex]::Matches($text, [regex]::Escape($receiptKey))).Count
  if ($receiptCounts[$name] -ne 1) { throw ('Unexpected receipt count in ' + $name) }
}

[PSCustomObject]@{
  ok = ($status -eq 'raw-evidence-saved')
  operation = 'tgb-hunan-raw-evidence-aftermarket'
  day = $day
  completedAt = $completedAt
  backupDir = $backupDir
  manifestFile = $manifestFile
  manifestSha256 = $manifestSha
  status = $status
  articleCount = $articles.Count
  downloadedImageCount = $downloadedCount
  articles = $safeArticles
  formalFileExists = (Test-Path -LiteralPath $formalFile)
  receiptKey = $receiptKey
  receiptCounts = $receiptCounts
  formalRowsChanged = $false
  combinedReasonRebuilt = $false
  applicationDeployed = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 8

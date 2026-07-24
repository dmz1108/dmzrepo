# DreamerQi production operation: force-refresh official @TGB Hunan raw evidence.
#
# Scope:
# - target trading day: 2026-07-24 (China time)
# - back up the existing raw-evidence directory, if present
# - run the raw-only server command with --force
# - validate the saved manifest and print only public article/image metadata
# - append a safe operation record to both cloud logs
#
# This script never invokes OCR/Qwen/vision, never writes formal structured TGB
# rows, never rebuilds the combined reason database, and never restarts services.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-24'
$rawRoot = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw'
$rawDir = Join-Path $rawRoot $day
$manifestFile = Join-Path $rawDir 'manifest.json'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-raw-' + $day.Replace('-', '') + '-' + $stamp)
$requiredTitle = -join @(
  [char]0x6E56,
  [char]0x5357,
  [char]0x4EBA,
  [char]0x6DA8,
  [char]0x505C,
  [char]0x590D,
  [char]0x76D8
)

if (-not (Test-Path -LiteralPath (Join-Path $project 'kpl-stats-server.js'))) {
  throw 'Production server entry file is missing.'
}

$backupCreated = $false
if (Test-Path -LiteralPath $rawDir) {
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  Copy-Item -LiteralPath $rawDir -Destination (Join-Path $backupDir $day) -Recurse -Force
  $backupCreated = $true
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

$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }
if ([string]$manifest.status -ne 'raw-evidence-saved') { throw ('Unexpected raw status: ' + [string]$manifest.status) }

$articles = @($manifest.articles)
if ($articles.Count -lt 1) { throw 'No official TGB article was saved.' }

$safeArticles = @()
$downloadedCount = 0
foreach ($article in $articles) {
  $articleUrl = [string]$article.url
  $articleTitle = [string]$article.title
  if ($articleUrl -notmatch '^https://www\.tgb\.cn/a/') { throw ('Unexpected article URL: ' + $articleUrl) }
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

if ($downloadedCount -lt 1) { throw 'No official TGB image was downloaded.' }

$completedAt = (Get-Date).ToUniversalTime().ToString('o')
$logEntry = @(
  ''
  ('## ' + $day + ' - tgb-hunan-raw-evidence-force-refresh')
  ('- Actor: ' + $env:DREAMERQI_OPS_ACTOR)
  ('- Commit: ' + $env:DREAMERQI_OPS_COMMIT)
  ('- Run: ' + $env:DREAMERQI_OPS_RUN_ID)
  ('- Forced official TGB raw evidence refresh for ' + $day + '; downloaded images: ' + $downloadedCount + '.')
  ('- Previous raw evidence backup: ' + $(if ($backupCreated) { $backupDir } else { 'not present' }))
  '- Formal structured TGB rows: unchanged'
  '- Combined main-reason database: unchanged'
  '- Service restart: none'
  ''
) -join "`r`n"

foreach ($name in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $file = Join-Path $project $name
  if (Test-Path -LiteralPath $file) {
    [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
  }
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-raw-evidence-force-refresh'
  day = $day
  completedAt = $completedAt
  backupDir = $(if ($backupCreated) { $backupDir } else { '' })
  manifestFile = $manifestFile
  status = [string]$manifest.status
  articleCount = $articles.Count
  downloadedImageCount = $downloadedCount
  articles = $safeArticles
  formalRowsChanged = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 8

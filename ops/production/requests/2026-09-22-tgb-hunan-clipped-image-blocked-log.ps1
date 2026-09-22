# Date-bound log-only receipt for the manually observed clipped official table.
# No OCR, automated visual reading, formal write, rebuild, or service restart.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$project = 'C:\PandaDashboard'
$day = '2026-09-22'
$rawDir = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-09-22'
$manifestFile = Join-Path $rawDir 'manifest.json'
$imageFile = Join-Path $rawDir 'image-01-06.png'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-09-22.json'
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$heading = '## 2026-09-22 - tgb-hunan-official-image-clipped-blocked'
$expectedSha = 'e84f0322f89fb1716d955dbdde5d8d8d5ebde9da6f888cdf7bdff8820fa24a73'
$articleUrl = 'https://www.tgb.cn/a/2viF9KUNi4A'
$requiredTitle = -join @([char]0x6E56, [char]0x5357, [char]0x4EBA, [char]0x6DA8, [char]0x505C, [char]0x590D, [char]0x76D8)

if (-not (Test-Path -LiteralPath $manifestFile)) { throw 'Raw manifest missing.' }
if (-not (Test-Path -LiteralPath $imageFile)) { throw 'Selected official image missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal file exists; refusing no-write receipt.' }
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ($manifest.day -ne $day -or $manifest.status -ne 'raw-evidence-saved') { throw 'Raw manifest identity mismatch.' }
$articles = @($manifest.articles | Where-Object { $null -ne $_ })
if ($articles.Count -ne 1 -or $articles[0].url -ne $articleUrl -or
    -not ([string]$articles[0].title).StartsWith('9.22', [System.StringComparison]::Ordinal) -or
    ([string]$articles[0].title).IndexOf($requiredTitle, [System.StringComparison]::Ordinal) -lt 0) {
  throw 'Official article identity mismatch.'
}
$imageSha = (Get-FileHash -LiteralPath $imageFile -Algorithm SHA256).Hash.ToLowerInvariant()
if ($imageSha -ne $expectedSha) { throw 'Official image hash changed.' }
$imageBytes = (Get-Item -LiteralPath $imageFile).Length
if ($imageBytes -ne 775955) { throw 'Official image length changed.' }

$logFiles = @()
$pending = @()
foreach ($name in $logNames) {
  $file = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $file)) { throw ('Cloud log missing: ' + $name) }
  $logFiles += $file
  $existing = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  if ($existing.IndexOf($heading, [System.StringComparison]::Ordinal) -lt 0) { $pending += $file }
}
$backupDir = ''
if ($pending.Count -gt 0) {
  $backupDir = Join-Path $project ('backups\tgb-hunan-blocked-20260922-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  foreach ($file in $logFiles) {
    Copy-Item -LiteralPath $file -Destination (Join-Path $backupDir ([System.IO.Path]::GetFileName($file))) -Force
  }
}
$entry = @(
  ''
  $heading
  ('- Target day: ' + $day + ' China time, trading day')
  ('- Official article: ' + $articleUrl)
  ('- Official white @TGB Hunan table: image-01-06.png; 530x4221; 775955 bytes; SHA-256 ' + $imageSha)
  '- Manual source-image finding: right edge cuts off detailReason for 605178 and 600641 in the semiconductor block; official max URL returns identical bytes.'
  '- Official article/raw images were force-refreshed; 13 images saved; source errors=0.'
  '- Formal rows: 0 written; terminal-pool reconciliation not started because image fields are incomplete.'
  '- Combined main-reason rebuild: no; application deployment: no; service restart: no.'
  ''
) -join "\r\n"
foreach ($file in $pending) {
  [System.IO.File]::AppendAllText($file, $entry, [System.Text.UTF8Encoding]::new($false))
}
[PSCustomObject]@{
  ok = $true
  day = $day
  blocker = 'official-image-right-edge-clipped'
  imageSha256 = $imageSha
  backupDir = $backupDir
  logsUpdated = @($pending | ForEach-Object { [System.IO.Path]::GetFileName($_) })
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 4

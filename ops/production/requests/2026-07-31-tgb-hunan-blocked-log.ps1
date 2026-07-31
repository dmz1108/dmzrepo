# DreamerQi production operation: record the blocked 2026-07-31 TGB Hunan
# manual transcription in the cloud operation logs.
#
# This request is log-only. It verifies the official raw evidence, selected
# image hash, same-day review-eligible terminal pool, and absence of a formal
# TGB file before recording the source-image truncation blocker. It never
# writes review rows, rebuilds the combined database, or restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-31'
$articleUrl = 'https://www.tgb.cn/a/2tSJcjNYab7'
$requiredTitle = -join @(
  [char]0x6E56,
  [char]0x5357,
  [char]0x4EBA,
  [char]0x6DA8,
  [char]0x505C,
  [char]0x590D,
  [char]0x76D8
)
$retiredMarker = [string][char]0x9000
$rawManifestFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-31\manifest.json'
$rawImageFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-31\image-01-06.png'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-31.json'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-07-31.json'
$expectedImageLength = 1505003
$expectedImageSha256 = '3048e335c7741d45f7231a5d44227006834b9a40bf99d85aa3ed60ff518726a3'
$expectedEligibleCodeSetSha256 = '908743e0babcb01990c299e4b3af97774d988811f24982b382e28eff814d678f'
$logHeading = '## 2026-07-31 - tgb-hunan-manual-source-image-blocked'

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Raw evidence manifest is missing.' }
if (-not (Test-Path -LiteralPath $rawImageFile)) { throw 'Selected official image evidence is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write blocker.' }
if (-not (Test-Path -LiteralPath $baselineFile)) { throw 'Same-day terminal limit-up pool is missing.' }

$manifest = Get-Content -LiteralPath $rawManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }
if ([string]$manifest.status -ne 'raw-evidence-saved') { throw 'Raw evidence manifest is not ready.' }
$articles = @($manifest.articles)
$article = @($articles | Where-Object {
  $candidateTitle = [string]$_.title
  ([string]$_.url -eq $articleUrl) -and
    $candidateTitle.StartsWith('7.31', [System.StringComparison]::Ordinal) -and
    $candidateTitle.IndexOf($requiredTitle, [System.StringComparison]::Ordinal) -ge 0
})
if ($article.Count -ne 1) { throw 'Expected official article metadata is absent or duplicated.' }

$imageInfo = Get-Item -LiteralPath $rawImageFile
$imageSha256 = (Get-FileHash -LiteralPath $rawImageFile -Algorithm SHA256).Hash.ToLowerInvariant()
if ($imageInfo.Length -ne $expectedImageLength -or $imageSha256 -ne $expectedImageSha256) {
  throw 'Selected official image length or SHA-256 mismatch.'
}

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
if ($eligibleRows.Count -ne 98 -or $eligibleCodes.Count -ne 98) {
  throw ('Unexpected review-eligible terminal pool: rows=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
}
$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()
if ($codeSetSha256 -ne $expectedEligibleCodeSetSha256) {
  throw 'Review-eligible terminal code-set SHA-256 mismatch.'
}

$logEntry = @(
  ''
  $logHeading
  ('- Actor: ' + $env:DREAMERQI_OPS_ACTOR)
  ('- Commit: ' + $env:DREAMERQI_OPS_COMMIT)
  ('- Run: ' + $env:DREAMERQI_OPS_RUN_ID)
  ('- Official article: ' + $articleUrl)
  '- Official image: image-01-06.png; 1505003 bytes; SHA-256 3048e335c7741d45f7231a5d44227006834b9a40bf99d85aa3ed60ff518726a3.'
  '- Codex manual first pass and second visual pass: 98 rows, 98 unique codes; missingCodes=[]; extraCodes=[]; duplicateCodes=[]; weakCount=0 before the image-legibility gate.'
  '- Manual topic counts: 18 + 17 + 14 + 7 + 6 + 4 + 4 + 3 + 3 + 3 + 12 + 7 = 98.'
  '- Source-image blocker: code 605178 detail reason is cut off at the right edge after the visible storage-chip phrase.'
  '- Source-image blocker: code 605198 detail reason is cut off at the right edge during the visible copper-clad phrase.'
  '- The official _760w and _max image URLs resolve to the same 530-pixel-wide bytes; missing pixels cannot be recovered by lossless zoom.'
  '- Name normalization note: code 000032 uses half-width A in the official image and full-width A in the terminal pool (NFKC-equivalent).'
  '- Formal structured TGB rows: not written'
  '- Combined main-reason database rebuilt: no'
  '- Public source-view remains TGB 0; existing combined, kaipanla, xuangubao, and jiuyangongshe counts remain 98.'
  '- Service restart: none'
  ''
) -join "`r`n"

$alreadyPresent = @()
foreach ($name in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $file = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $file)) { throw ('Cloud operation log is missing: ' + $name) }
  $existing = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  if ($existing.IndexOf($logHeading, [System.StringComparison]::Ordinal) -ge 0) {
    $alreadyPresent += $name
    continue
  }
  [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-manual-source-image-blocked'
  day = $day
  officialArticle = $articleUrl
  officialImage = 'image-01-06.png'
  imageLength = $imageInfo.Length
  imageSha256 = $imageSha256
  rawBaselineCount = $baselineRows.Count
  eligibleBaselineCount = $eligibleRows.Count
  eligibleCodeSetSha256 = $codeSetSha256
  manualCount = 98
  missingCodes = @()
  extraCodes = @()
  duplicateCodes = @()
  weakCount = 0
  blockedCodes = @('605178', '605198')
  logAlreadyPresent = $alreadyPresent
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

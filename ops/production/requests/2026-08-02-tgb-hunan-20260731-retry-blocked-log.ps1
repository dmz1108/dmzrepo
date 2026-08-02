# DreamerQi production operation: record that the 2026-08-02 retry of the
# 2026-07-31 TGB Hunan official image remains blocked.
#
# This request is log-only. It verifies the refreshed raw evidence, exact image
# bytes, prior raw-evidence backup, review-eligible terminal pool, and absence
# of a formal TGB file. It never writes review rows, rebuilds the combined
# database, or restarts a service.

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
$rawBackupDir = Join-Path $project 'backups\tgb-hunan-raw-20260731-20260802-223042'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-31.json'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-07-31.json'
$expectedImageLength = 1505003
$expectedImageSha256 = '3048e335c7741d45f7231a5d44227006834b9a40bf99d85aa3ed60ff518726a3'
$expectedEligibleCodeSetSha256 = '908743e0babcb01990c299e4b3af97774d988811f24982b382e28eff814d678f'
$logHeading = '## 2026-08-02 - tgb-hunan-20260731-retry-still-blocked'

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Refreshed raw evidence manifest is missing.' }
if (-not (Test-Path -LiteralPath $rawImageFile)) { throw 'Selected official image evidence is missing.' }
if (-not (Test-Path -LiteralPath $rawBackupDir)) { throw 'Expected pre-retry raw-evidence backup is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write retry.' }
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
$savedImages = @($article[0].images | Where-Object { $_.saved -eq $true -and -not [string]$_.error })
if ($savedImages.Count -ne 22) { throw ('Unexpected refreshed image count: ' + $savedImages.Count) }

$selectedImage = @($savedImages | Where-Object { [string]$_.file -eq 'image-01-06.png' })
if ($selectedImage.Count -ne 1 -or [int64]$selectedImage[0].length -ne $expectedImageLength) {
  throw 'Selected image metadata is absent, duplicated, or changed.'
}
$imageInfo = Get-Item -LiteralPath $rawImageFile
$imageSha256 = (Get-FileHash -LiteralPath $rawImageFile -Algorithm SHA256).Hash.ToLowerInvariant()
if ($imageInfo.Length -ne $expectedImageLength -or $imageSha256 -ne $expectedImageSha256) {
  throw 'Selected official image length or SHA-256 changed.'
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
if ($baselineRows.Count -ne 99 -or $eligibleRows.Count -ne 98 -or $eligibleCodes.Count -ne 98) {
  throw ('Unexpected terminal pool: raw=' + $baselineRows.Count + '; eligible=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
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
  '- Protected raw-evidence retry run: 30752232728; downloaded images: 22.'
  ('- Pre-retry raw-evidence backup: ' + $rawBackupDir)
  '- Official image remains image-01-06.png; 530x8162; 1505003 bytes; SHA-256 3048e335c7741d45f7231a5d44227006834b9a40bf99d85aa3ed60ff518726a3.'
  '- The official _760w and _max URLs remain byte-identical; the author/CDN did not replace the table image.'
  '- Source-image blockers remain code 605178 and code 605198; both detail reasons are still cut off at the right edge.'
  '- Terminal reconciliation remains raw 99, eligible 98, unique 98; candidate code set unchanged; missingCodes=[]; extraCodes=[]; duplicateCodes=[].'
  '- Formal structured TGB rows: not written'
  '- Combined main-reason database rebuilt: no'
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
  operation = 'tgb-hunan-20260731-retry-still-blocked'
  day = $day
  officialArticle = $articleUrl
  officialImage = 'image-01-06.png'
  imageLength = $imageInfo.Length
  imageSha256 = $imageSha256
  downloadedImageCount = $savedImages.Count
  rawBaselineCount = $baselineRows.Count
  eligibleBaselineCount = $eligibleRows.Count
  eligibleCodeSetSha256 = $codeSetSha256
  blockedCodes = @('605178', '605198')
  rawBackupDir = $rawBackupDir
  logAlreadyPresent = $alreadyPresent
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

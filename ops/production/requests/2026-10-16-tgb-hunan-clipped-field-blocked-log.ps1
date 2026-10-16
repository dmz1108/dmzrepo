# DreamerQi production operation: record the 2026-10-16 @TGB Hunan
# right-edge-clipped-field blocker after manual second-pass review.
#
# This request validates the official raw evidence, same-day terminal pool,
# absence of a formal TGB file, and then appends one idempotent safe receipt to
# both cloud logs. It does not write formal rows, rebuild combined reasons, or
# restart any service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-10-16'
$articleUrl = 'https://www.tgb.cn/a/2vWuvTJBwkA'
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
$imageFile = 'image-01-06.png'
$expectedImageLength = 853657
$expectedImageSha256 = 'f7418ae8ba0577666272ec5cc79474c648a630d5bc59193f4627ce7e2efcab37'
$expectedRawCount = 61
$expectedEligibleCount = 59
$expectedExcludedCodes = @('920006', '920690')
$expectedEligibleCodeSetSha256 = '35ced4c2ff587cccf6b545850e3406c601fa368463169a7d8ea12c64adbad093'
$manifestFile = Join-Path $project ('kpl-limitup-main-reason-sources\tgb-hunan-raw\' + $day + '\manifest.json')
$imagePath = Join-Path $project ('kpl-limitup-main-reason-sources\tgb-hunan-raw\' + $day + '\' + $imageFile)
$baselineFile = Join-Path $project ('kpl-limitup-db\' + $day + '.json')
$formalFile = Join-Path $project ('kpl-limitup-main-reason-sources\tgb-hunan-structured\' + $day + '.json')
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$receiptKey = 'tgb-hunan-manual-blocked-clipped-field-2026-10-16-605178'
$retiredMarker = [string][char]0x9000

foreach ($path in @($manifestFile, $imagePath, $baselineFile)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw ('Required evidence missing: ' + $path) }
}
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file unexpectedly exists.' }

$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day -or [string]$manifest.status -ne 'raw-evidence-saved') {
  throw 'Raw manifest status/day mismatch.'
}
$article = @($manifest.articles) | Where-Object { [string]$_.url -eq $articleUrl } | Select-Object -First 1
if (-not $article) { throw 'Official article metadata mismatch.' }
$savedTitle = [string]$article.title
if ((-not $savedTitle.StartsWith($requiredDayTitle, [System.StringComparison]::Ordinal)) -or ($savedTitle.IndexOf($requiredTitle, [System.StringComparison]::Ordinal) -lt 0)) {
  throw 'Official article title mismatch.'
}
$image = @($article.images) | Where-Object {
  [string]$_.file -eq $imageFile -and $_.saved -eq $true -and -not [string]$_.error
} | Select-Object -First 1
if (-not $image -or [int64]$image.length -ne $expectedImageLength) {
  throw 'Official image metadata mismatch.'
}
$imageInfo = Get-Item -LiteralPath $imagePath
$imageSha256 = (Get-FileHash -LiteralPath $imagePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($imageInfo.Length -ne $expectedImageLength -or $imageSha256 -ne $expectedImageSha256) {
  throw 'Official image length/SHA-256 mismatch.'
}

$baseline = Get-Content -LiteralPath $baselineFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$baseline.day -ne $day) { throw 'Terminal pool day mismatch.' }
$rawRows = @($baseline.stocks)
$rawCodes = @($rawRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
$eligibleRows = @($rawRows | Where-Object {
  $code = [string]$_.code
  $name = [string]$_.name
  ($code -notmatch '^[489]') -and
    ($name -notmatch '(?i)\*?ST') -and
    ($name.IndexOf($retiredMarker, [System.StringComparison]::Ordinal) -lt 0) -and
    ($name -notmatch '(?i)^[NC]')
})
$excludedCodes = @($rawRows | Where-Object {
  $code = [string]$_.code
  $name = [string]$_.name
  ($code -match '^[489]') -or
    ($name -match '(?i)\*?ST') -or
    ($name.IndexOf($retiredMarker, [System.StringComparison]::Ordinal) -ge 0) -or
    ($name -match '(?i)^[NC]')
} | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
$eligibleCodes = @($eligibleRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
if ($rawRows.Count -ne $expectedRawCount -or $rawCodes.Count -ne $expectedRawCount) {
  throw 'Unexpected raw terminal-pool count or duplicates.'
}
if ($eligibleRows.Count -ne $expectedEligibleCount -or $eligibleCodes.Count -ne $expectedEligibleCount) {
  throw 'Unexpected eligible terminal-pool count or duplicates.'
}
if (($excludedCodes -join ',') -ne ($expectedExcludedCodes -join ',')) {
  throw ('Unexpected excluded terminal-pool codes: ' + ($excludedCodes -join ','))
}
$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()
if ($codeSetSha256 -ne $expectedEligibleCodeSetSha256) {
  throw 'Eligible terminal-pool code-set SHA-256 mismatch.'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-blocked-' + $day.Replace('-', '') + '-' + $stamp)
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
foreach ($name in $logNames) {
  $logPath = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $logPath -PathType Leaf)) { throw ('Cloud log missing: ' + $name) }
  Copy-Item -LiteralPath $logPath -Destination (Join-Path $backupDir $name) -Force
}

$logEntry = @(
  ''
  ('## ' + $day + ' - tgb-hunan-manual-blocked-clipped-field')
  ('- Receipt: ' + $receiptKey)
  ('- Article: ' + $articleUrl)
  ('- Official image: ' + $imageFile + '; length=' + $expectedImageLength + '; sha256=' + $expectedImageSha256)
  '- Codex manually transcribed 59 candidate rows from the official white @TGB Hunan table and began a field-by-field second pass; no OCR, Qwen, or automatic vision result was used.'
  '- Blocker: row 605178 has a right-edge-clipped detailReason; the visible official text ends inside a parenthetical storage-chip phrase and the full field cannot be verified.'
  '- The separate red THS data-visualization image was excluded and was not used to generate, complete, guess, or validate the formal row.'
  ('- Terminal-pool gate before the blocker: raw=' + $expectedRawCount + '; eligible=' + $expectedEligibleCount + '; excluded=' + ($expectedExcludedCodes -join ',') + '; unique=' + $expectedEligibleCount + '; eligible-code-set-sha256=' + $expectedEligibleCodeSetSha256 + '.')
  '- Candidate code-set comparison: missing=0; extra=0; duplicates=0; topic-block total=59. Formal quality gate stopped because one detailReason is not fully legible.'
  ('- Cloud-log backup: ' + $backupDir)
  '- Formal TGB rows written: 0; combined main-reason rebuild: no'
  '- Application deployment: none; service restart: none'
  ''
) -join "`r`n"

foreach ($name in $logNames) {
  $logPath = Join-Path $project $name
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
  ok = $false
  status = 'blocked-clipped-field'
  operation = 'tgb-hunan-manual-blocked-clipped-field'
  day = $day
  articleUrl = $articleUrl
  imageFile = $imageFile
  imageSha256 = $imageSha256
  blockedCode = '605178'
  blockedField = 'detailReason'
  visiblePrefix = 'right-edge clipped inside parenthetical storage-chip phrase'
  rawCount = $rawRows.Count
  eligibleCount = $eligibleRows.Count
  excludedCodes = $excludedCodes
  eligibleCodeSetSha256 = $codeSetSha256
  backupDir = $backupDir
  receiptKey = $receiptKey
  receiptCounts = $receiptCounts
  formalFileExists = (Test-Path -LiteralPath $formalFile)
  formalRowsWritten = 0
  combinedReasonRebuilt = $false
  applicationDeployed = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 6

# DreamerQi production operation: record the blocked 2026-08-05 TGB Hunan
# daily review after the terminal-pool reconciliation failed.
#
# This request is log-only. It validates the official raw evidence, the terminal
# pool discrepancy, and the absence of a formal TGB file. It backs up both cloud
# logs before appending an idempotent safe record. It never writes formal rows,
# rebuilds the combined database, or restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-08-05'
$rawManifestFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-08-05\manifest.json'
$rawImageFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-08-05\image-01-06.png'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-08-05.json'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-08-05.json'
$logNames = @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')
$logHeading = '## 2026-08-05 - tgb-hunan-reconciliation-blocked'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $project ('backups\tgb-hunan-blocked-20260805-' + $stamp)
$retiredMarker = [string][char]0x9000
$expectedEligibleCodeSetSha256 = 'e5cc5d2b18fac8e83a056e1c6dd67a554c381fa3fea86b02e3157ed90baf1987'
$manualCandidateCodeSetSha256 = '66a3b94c72601182627a847a34666371bd8087bd82aa1c49ed6f32421a39e746'
$expectedImageSha256 = 'eb61a2164d33fc0e344d4a6f93e66ed690b9bb079ab2325409b395fc4d6e97af'

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Raw evidence manifest is missing.' }
if (-not (Test-Path -LiteralPath $rawImageFile)) { throw 'Selected official image is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write blocker.' }
if (-not (Test-Path -LiteralPath $baselineFile)) { throw 'Same-day terminal limit-up pool is missing.' }

$manifest = Get-Content -LiteralPath $rawManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day -or [string]$manifest.status -ne 'raw-evidence-saved') {
  throw 'Raw evidence manifest status/day mismatch.'
}
$article = @($manifest.articles | Where-Object { [string]$_.url -eq 'https://www.tgb.cn/a/2u10yPnYbir' })[0]
$image = @($article.images | Where-Object {
  [string]$_.file -eq 'image-01-06.png' -and
    [string]$_.url -eq 'https://image.tgb.cn/img/2026/08/05/hgiet2qf4nmm.png_760w.png' -and
    $_.saved -eq $true -and
    [int64]$_.length -eq 1279169 -and
    -not [string]$_.error
})[0]
if (-not $article -or -not $image) { throw 'Selected official article/image is absent from raw evidence.' }
$imageSha256 = (Get-FileHash -LiteralPath $rawImageFile -Algorithm SHA256).Hash.ToLowerInvariant()
if ($imageSha256 -ne $expectedImageSha256) { throw 'Selected official image SHA-256 mismatch.' }

$baseline = Get-Content -LiteralPath $baselineFile -Raw -Encoding UTF8 | ConvertFrom-Json
$baselineRows = @($baseline.stocks)
$rawCodes = @($baselineRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
$eligibleRows = @($baselineRows | Where-Object {
  $code = [string]$_.code
  $name = [string]$_.name
  ($code -notmatch '^[489]') -and
    ($name -notmatch '(?i)\*?ST') -and
    ($name.IndexOf($retiredMarker, [System.StringComparison]::Ordinal) -lt 0) -and
    ($name -notmatch '(?i)^[NC]')
})
$eligibleCodes = @($eligibleRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)
$excludedRows = @($baselineRows | Where-Object { [string]$_.code -notin $eligibleCodes })
if ($baselineRows.Count -ne 104 -or $rawCodes.Count -ne 104) {
  throw ('Unexpected raw terminal pool: rows=' + $baselineRows.Count + '; unique=' + $rawCodes.Count)
}
if ($eligibleRows.Count -ne 103 -or $eligibleCodes.Count -ne 103) {
  throw ('Unexpected review-eligible terminal pool: rows=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
}
if ($excludedRows.Count -ne 1 -or [string]$excludedRows[0].code -ne '920117') {
  throw 'Unexpected terminal-pool exclusion set.'
}
if ($eligibleCodes -notcontains '601138') { throw 'Expected reconciliation-only terminal-pool code is missing.' }
$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()
if ($codeSetSha256 -ne $expectedEligibleCodeSetSha256) { throw 'Eligible terminal-pool code-set SHA-256 mismatch.' }

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
  '- Official article: https://www.tgb.cn/a/2u10yPnYbir'
  ('- Official image: image-01-06.png; length=1279169; sha256=' + $imageSha256)
  '- Manual transcription: 102 rows, 102 unique codes, 15 topic blocks totaling 102; second pass reviewed; OCR/Qwen/automatic vision not used.'
  ('- Manual candidate code-set SHA-256: ' + $manualCandidateCodeSetSha256)
  ('- Terminal pool: 104 raw/104 unique; 103 eligible/103 unique; excluded Beijing Exchange code 920117; eligible code-set SHA-256 ' + $codeSetSha256 + '.')
  '- Reconciliation: missingCodes=[601138]; extraCodes=[]; duplicateCodes=[]; weakCount=0.'
  '- Blocker: 601138 Industrial Fulian is present in the terminal pool but appears only in the official image broken-limit section, which is forbidden from formal TGB rows.'
  '- Formal structured TGB rows: not written'
  '- Combined main-reason database rebuilt: no'
  '- Service restart: none'
  ''
) -join "`r`n"

foreach ($file in $missingHeadingFiles) {
  [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-reconciliation-blocked'
  day = $day
  articleUrl = 'https://www.tgb.cn/a/2u10yPnYbir'
  imageFile = 'image-01-06.png'
  imageSha256 = $imageSha256
  manualCandidateCount = 102
  manualCandidateUniqueCount = 102
  rawBaselineCount = $baselineRows.Count
  rawBaselineUniqueCount = $rawCodes.Count
  eligibleBaselineCount = $eligibleRows.Count
  eligibleBaselineUniqueCount = $eligibleCodes.Count
  excludedCodes = @('920117')
  missingCodes = @('601138')
  extraCodes = @()
  duplicateCodes = @()
  weakCount = 0
  backupDir = $(if ($backupCreated) { $backupDir } else { '' })
  logsUpdated = @($missingHeadingFiles | ForEach-Object { [System.IO.Path]::GetFileName($_) })
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

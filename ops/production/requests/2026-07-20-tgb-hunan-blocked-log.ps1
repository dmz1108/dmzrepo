# DreamerQi production operation: record the failed 2026-07-20 TGB Hunan
# pre-write reconciliation gate in the cloud operation logs.
#
# This request is log-only. It verifies that raw evidence and the same-day
# terminal pool exist, that no formal TGB file was written, then appends the
# safe discrepancy summary. It never writes review data, rebuilds the combined
# reason database, or restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-20'
$rawManifestFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-20\manifest.json'
$rawImageFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-20\image-01-06.png'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-20.json'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-07-20.json'

if (-not (Test-Path -LiteralPath $rawManifestFile)) { throw 'Raw evidence manifest is missing.' }
if (-not (Test-Path -LiteralPath $rawImageFile)) { throw 'Selected official image evidence is missing.' }
if (Test-Path -LiteralPath $formalFile) { throw 'Formal TGB file exists; refusing to log a no-write blocker.' }
if (-not (Test-Path -LiteralPath $baselineFile)) { throw 'Same-day terminal limit-up pool is missing.' }

$manifest = Get-Content -LiteralPath $rawManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.day -ne $day) { throw 'Raw evidence manifest day mismatch.' }
if ([string]$manifest.status -ne 'raw-evidence-saved') { throw 'Raw evidence manifest is not ready.' }

$baseline = Get-Content -LiteralPath $baselineFile -Raw -Encoding UTF8 | ConvertFrom-Json
$baselineRows = @($baseline.stocks)
if ($baselineRows.Count -ne 52) { throw ('Unexpected same-day terminal pool count: ' + $baselineRows.Count) }

$baselineCodes = @($baselineRows | ForEach-Object { [string]$_.code })
if ($baselineCodes -notcontains '600227') { throw 'Expected baseline-only code 600227 is absent.' }
if ($baselineCodes -contains '601991') { throw 'Expected manual-only code 601991 unexpectedly entered the baseline.' }
if ($baselineCodes -contains '603533') { throw 'Expected manual-only code 603533 unexpectedly entered the baseline.' }

$logEntry = @(
  ''
  '## 2026-07-20 - tgb-hunan-manual-prewrite-gate-blocked'
  ('- Actor: ' + $env:DREAMERQI_OPS_ACTOR)
  ('- Commit: ' + $env:DREAMERQI_OPS_COMMIT)
  ('- Run: ' + $env:DREAMERQI_OPS_RUN_ID)
  '- Official article: https://www.tgb.cn/a/2tAptm3XkHu'
  '- Official image: image-01-06.png'
  '- Manual second-pass candidate: 53 rows; terminal baseline: 52 rows.'
  '- Gate failed: missingCodes=[600227]; extraCodes=[601991,603533]; duplicateCodes=[]; weakCount=0.'
  '- Topic counts: 18 + 7 + 6 + 4 + 3 + 15 = 53.'
  '- Name normalization note: code 000539 uses half-width A in the official image and full-width A in the terminal pool.'
  '- Formal structured TGB rows: not written'
  '- Combined main-reason database rebuilt: no'
  '- Service restart: none'
  ''
) -join "`r`n"

foreach ($name in @('panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md')) {
  $file = Join-Path $project $name
  if (-not (Test-Path -LiteralPath $file)) { throw ('Cloud operation log is missing: ' + $name) }
  [System.IO.File]::AppendAllText($file, $logEntry, [System.Text.UTF8Encoding]::new($false))
}

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-manual-prewrite-gate-blocked'
  day = $day
  officialArticle = 'https://www.tgb.cn/a/2tAptm3XkHu'
  officialImage = 'image-01-06.png'
  manualCount = 53
  baselineCount = 52
  missingCodes = @('600227')
  extraCodes = @('601991', '603533')
  duplicateCodes = @()
  weakCount = 0
  formalRowsWritten = $false
  combinedReasonRebuilt = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

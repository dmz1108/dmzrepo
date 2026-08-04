# DreamerQi production operation: read-only prewrite inspection for the
# 2026-08-04 @TGB Hunan manual review.
#
# This request reads only the same-day terminal limit-up pool and formal-file
# presence. It prints the review-eligible count, excluded public stock metadata,
# and eligible code-set SHA-256. It does not write files or restart services.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-08-04'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-08-04.json'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-08-04.json'
$retiredMarker = [string][char]0x9000

if (-not (Test-Path -LiteralPath $baselineFile)) {
  throw 'Same-day terminal limit-up pool is missing.'
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
$excludedRows = @($rawRows | Where-Object {
  $code = [string]$_.code
  $name = [string]$_.name
  ($code -match '^[489]') -or
    ($name -match '(?i)\*?ST') -or
    ($name.IndexOf($retiredMarker, [System.StringComparison]::Ordinal) -ge 0) -or
    ($name -match '(?i)^[NC]')
} | ForEach-Object {
  [PSCustomObject]@{ code = [string]$_.code; name = [string]$_.name }
})
$eligibleCodes = @($eligibleRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)

if ($rawRows.Count -ne 138 -or $rawCodes.Count -ne 138) {
  throw ('Unexpected raw terminal pool: rows=' + $rawRows.Count + '; unique=' + $rawCodes.Count)
}
if ($eligibleRows.Count -ne 137 -or $eligibleCodes.Count -ne 137) {
  throw ('Unexpected review-eligible pool: rows=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
}
if ($excludedRows.Count -ne 1) {
  throw ('Unexpected excluded-row count: ' + $excludedRows.Count)
}

$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-prewrite-inspect'
  day = $day
  rawCount = $rawRows.Count
  rawUniqueCount = $rawCodes.Count
  eligibleCount = $eligibleRows.Count
  eligibleUniqueCount = $eligibleCodes.Count
  excludedRows = $excludedRows
  eligibleCodeSetSha256 = $codeSetSha256
  formalFileExists = (Test-Path -LiteralPath $formalFile)
  filesWritten = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

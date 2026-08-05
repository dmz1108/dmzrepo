# DreamerQi production operation: read-only prewrite inspection for the
# 2026-08-05 @TGB Hunan manual review.
#
# This request reads only the same-day terminal limit-up pool and formal-file
# presence. It prints the filtered public stock-code/name set, excluded public
# stock metadata, and code-set SHA-256. It does not write files or restart services.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-08-05'
$baselineFile = Join-Path $project 'kpl-limitup-db\2026-08-05.json'
$formalFile = Join-Path $project 'kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-08-05.json'
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
} | ForEach-Object {
  [PSCustomObject]@{ code = [string]$_.code; name = [string]$_.name }
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
$eligibleRows = @($eligibleRows | Sort-Object code)
$eligibleCodes = @($eligibleRows | ForEach-Object { [string]$_.code } | Sort-Object -Unique)

if ($rawRows.Count -ne 104 -or $rawCodes.Count -ne 104) {
  throw ('Unexpected raw terminal pool: rows=' + $rawRows.Count + '; unique=' + $rawCodes.Count)
}
if ($eligibleRows.Count -ne $eligibleCodes.Count) {
  throw ('Duplicate review-eligible codes: rows=' + $eligibleRows.Count + '; unique=' + $eligibleCodes.Count)
}

$codeSetBytes = [System.Text.Encoding]::UTF8.GetBytes(($eligibleCodes -join "`n"))
$codeSetSha256 = ([System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash($codeSetBytes)
)).Replace('-', '').ToLowerInvariant()

$industrialFulian = @($rawRows | Where-Object { [string]$_.code -eq '601138' } | ForEach-Object {
  [PSCustomObject]@{
    code = [string]$_.code
    name = [string]$_.name
    price = $_.price
    changePct = $_.changePct
    firstLimitTime = [string]$_.firstLimitTime
    lastLimitTime = [string]$_.lastLimitTime
    openCount = $_.openCount
    limitUpCount = [string]$_.limitUpCount
  }
})

[PSCustomObject]@{
  ok = $true
  operation = 'tgb-hunan-prewrite-inspect'
  day = $day
  rawCount = $rawRows.Count
  rawUniqueCount = $rawCodes.Count
  eligibleCount = $eligibleRows.Count
  eligibleUniqueCount = $eligibleCodes.Count
  excludedRows = $excludedRows
  eligibleRows = $eligibleRows
  eligibleCodeSetSha256 = $codeSetSha256
  industrialFulian = $industrialFulian
  formalFileExists = (Test-Path -LiteralPath $formalFile)
  filesWritten = $false
  serviceRestarted = $false
} | ConvertTo-Json -Depth 5

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = 'C:\PandaDashboard'
$Stage = Join-Path $Root '_incoming\chatter-option2-20260722'
$DbPath = Join-Path $Root 'panda-chatter\posts.json'
$ImageDir = Join-Path $Root 'panda-chatter\images'
$PayloadPath = Join-Path $Stage '2026-07-22-chatter-option2-seed.json'
$ExpectedPayloadSha256 = 'eed719bfc64f2b1b17939f6e36433d230b3204e8bd201c10b3d1ad6e31a4ae7a'
$ExpectedImageSha256 = [ordered]@{
  'chat-seed-coffee.png' = '1e498ff466bb042eb743cb18237ca9012a9e10bbfc489e8f1bcfea8a19a7d60d'
  'chat-seed-rain.png' = '371c7d9a72795279365f8cd41955ca0f9df88e98987895bc2757db4ee75f956c'
  'chat-seed-reading.png' = '9f0bf96c1398d395370df6cbd15141981874a891646f071eb5c8427ceddd1fe3'
  'chat-seed-riverside.png' = '70ab9f0cbf52cf0a781fda9be3e6cfbaee388c9ecaa14f61b674aa569c628503'
}
$ExpectedSeedIds = @(
  'chat_seed_20260722_coffee',
  'chat_seed_20260722_rain',
  'chat_seed_20260722_reading',
  'chat_seed_20260722_riverside',
  'chat_seed_20260722_habit'
)

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
  throw "Project root is missing: $Root"
}
if (-not (Test-Path -LiteralPath $Stage -PathType Container)) {
  throw "Staging directory is missing: $Stage"
}
if (-not (Test-Path -LiteralPath $PayloadPath -PathType Leaf)) {
  throw "Seed payload is missing: $PayloadPath"
}
if ((Get-Sha256 $PayloadPath) -ne $ExpectedPayloadSha256) {
  throw 'Seed payload SHA-256 mismatch'
}
foreach ($entry in $ExpectedImageSha256.GetEnumerator()) {
  $stagedImage = Join-Path $Stage $entry.Key
  if (-not (Test-Path -LiteralPath $stagedImage -PathType Leaf)) {
    throw "Staged image is missing: $($entry.Key)"
  }
  if ((Get-Sha256 $stagedImage) -ne $entry.Value) {
    throw "Staged image SHA-256 mismatch: $($entry.Key)"
  }
  if ((Get-Item -LiteralPath $stagedImage).Length -gt 5242880) {
    throw "Staged image exceeds 5 MB: $($entry.Key)"
  }
}

$seedPayload = Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
$seedPosts = @($seedPayload.posts)
$seedIds = @($seedPosts | ForEach-Object { [string]$_.id })
$seedReplyCount = @($seedPosts | ForEach-Object { @($_.comments).Count } | Measure-Object -Sum).Sum
$seedImageCount = @($seedPosts | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_.imageName) }).Count
if ($seedPosts.Count -ne 5 -or $seedReplyCount -ne 11 -or $seedImageCount -ne 4) {
  throw "Unexpected seed shape: posts=$($seedPosts.Count), replies=$seedReplyCount, images=$seedImageCount"
}
if (@($seedIds | Sort-Object -Unique).Count -ne 5) {
  throw 'Seed post IDs are not unique'
}
foreach ($expectedId in $ExpectedSeedIds) {
  if ($seedIds -notcontains $expectedId) {
    throw "Seed payload is missing expected ID: $expectedId"
  }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupDir = Join-Path $Root "backups\chatter-option2-seed-20260722-$stamp"
$DbExisted = Test-Path -LiteralPath $DbPath -PathType Leaf
$dbBackupPath = Join-Path $BackupDir 'posts.json'
$completed = $false

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
New-Item -ItemType Directory -Path $ImageDir -Force | Out-Null
if ($DbExisted) {
  Copy-Item -LiteralPath $DbPath -Destination $dbBackupPath -Force
}
foreach ($name in $ExpectedImageSha256.Keys) {
  $targetImage = Join-Path $ImageDir $name
  if (Test-Path -LiteralPath $targetImage -PathType Leaf) {
    Copy-Item -LiteralPath $targetImage -Destination (Join-Path $BackupDir $name) -Force
  }
}

try {
  if ($DbExisted) {
    $current = Get-Content -LiteralPath $DbPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $existingPosts = @($current.posts)
  } else {
    $existingPosts = @()
  }

  $preservedPosts = @($existingPosts | Where-Object { $seedIds -notcontains [string]$_.id })
  $nextPosts = @($seedPosts + $preservedPosts | Select-Object -First 500)
  $nextDb = [ordered]@{
    version = 1
    updatedAt = (Get-Date).ToUniversalTime().ToString('o')
    count = $nextPosts.Count
    posts = $nextPosts
  }

  foreach ($name in $ExpectedImageSha256.Keys) {
    $sourceImage = Join-Path $Stage $name
    $targetImage = Join-Path $ImageDir $name
    $tempImage = "$targetImage.tmp"
    Copy-Item -LiteralPath $sourceImage -Destination $tempImage -Force
    Move-Item -LiteralPath $tempImage -Destination $targetImage -Force
  }

  $dbTemp = "$DbPath.option2.tmp"
  Write-Utf8NoBom $dbTemp ($nextDb | ConvertTo-Json -Depth 12)
  Move-Item -LiteralPath $dbTemp -Destination $DbPath -Force

  $written = Get-Content -LiteralPath $DbPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $writtenSeeds = @($written.posts | Where-Object { $seedIds -contains [string]$_.id })
  $writtenSeedIds = @($writtenSeeds | ForEach-Object { [string]$_.id })
  $writtenReplyCount = @($writtenSeeds | ForEach-Object { @($_.comments).Count } | Measure-Object -Sum).Sum
  if ($writtenSeeds.Count -ne 5 -or @($writtenSeedIds | Sort-Object -Unique).Count -ne 5 -or $writtenReplyCount -ne 11) {
    throw 'Written chatter seed validation failed'
  }
  foreach ($entry in $ExpectedImageSha256.GetEnumerator()) {
    $targetImage = Join-Path $ImageDir $entry.Key
    if ((Get-Sha256 $targetImage) -ne $entry.Value) {
      throw "Written image validation failed: $($entry.Key)"
    }
  }

  $cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $api = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/chatter/posts?_=$cacheBust" -TimeoutSec 20
  $publicSeeds = @($api.posts | Where-Object { $seedIds -contains [string]$_.id })
  if (-not $api.ok -or $publicSeeds.Count -ne 5) {
    throw 'Local chatter API does not expose all seed posts'
  }
  if (@($publicSeeds | Where-Object { [string]::IsNullOrWhiteSpace([string]$_.topic) }).Count -ne 0) {
    throw 'Local chatter API does not expose seed topics'
  }
  foreach ($name in $ExpectedImageSha256.Keys) {
    $imageResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8765/api/chatter/image/$name" -TimeoutSec 20
    if ($imageResponse.StatusCode -ne 200) {
      throw "Local chatter image endpoint failed: $name"
    }
  }

  $logLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Chatter option 2 seed installed: 5 public posts, 11 replies, 4 images; existing posts preserved; backup=$BackupDir; service restart=none."
  Add-Content -LiteralPath (Join-Path $Root 'panda-cloud-ops-2026-06-19.md') -Value $logLine -Encoding UTF8
  Add-Content -LiteralPath (Join-Path $Root '_cloud-change-log-20260705.md') -Value $logLine -Encoding UTF8
  $completed = $true

  Remove-Item -LiteralPath $Stage -Recurse -Force
  [ordered]@{
    ok = $true
    seedPosts = $publicSeeds.Count
    seedReplies = $writtenReplyCount
    seedImages = $ExpectedImageSha256.Count
    totalPosts = @($written.posts).Count
    backup = $BackupDir
    stageRemoved = -not (Test-Path -LiteralPath $Stage)
  } | ConvertTo-Json -Compress
} catch {
  if ($DbExisted -and (Test-Path -LiteralPath $dbBackupPath -PathType Leaf)) {
    Copy-Item -LiteralPath $dbBackupPath -Destination $DbPath -Force
  } elseif (-not $DbExisted -and (Test-Path -LiteralPath $DbPath -PathType Leaf)) {
    Remove-Item -LiteralPath $DbPath -Force
  }
  foreach ($name in $ExpectedImageSha256.Keys) {
    $targetImage = Join-Path $ImageDir $name
    $backupImage = Join-Path $BackupDir $name
    if (Test-Path -LiteralPath $backupImage -PathType Leaf) {
      Copy-Item -LiteralPath $backupImage -Destination $targetImage -Force
    } elseif (Test-Path -LiteralPath $targetImage -PathType Leaf) {
      Remove-Item -LiteralPath $targetImage -Force
    }
  }
  throw
} finally {
  if (-not $completed) {
    Write-Error "Chatter option 2 seed failed and rollback was attempted. Backup: $BackupDir"
  }
}

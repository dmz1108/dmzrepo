const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok: ${message}`);
}

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'ops', 'production', 'requests', '2026-08-04-pr382-startup-diagnose.ps1');
const manifestPath = path.join(root, 'ops', 'production', 'manifests', 'pr382-startup-diagnose-20260804.json');
const script = fs.readFileSync(scriptPath, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sources = new Set(manifest.files.map(item => item.source));

assert(manifest.restart === 'none', 'diagnostic manifest never restarts production services');
assert(sources.has('kpl-stats-server.js'), 'diagnostic archive pins the approved server entry point');
for (const required of [
  'strategy-evidence.js',
  'strategy-daily-events.js',
  'strategy-daily-event-quality.js',
  'strategy-realtime-data.js',
  'strategy-observation-report.js',
  'review-source-artifact-guard.js',
  'review-source-health.js',
  'review-source-health-manifest.js',
  'strategy-backend.js',
  'l2-focus-scanner.js',
  'local-l2-task-queue.js',
]) assert(sources.has(required), `diagnostic archive includes ${required}`);

assert(script.includes("$env:KPL_STATS_PORT = '18765'"), 'probe uses an isolated loopback port');
assert(script.includes("$env:KPL_STATS_HOST = '127.0.0.1'"), 'probe cannot bind publicly');
assert(script.includes("-WorkingDirectory $stagingRoot"), 'probe runs only from the temporary isolated archive');
assert(script.includes("diagnostic loopback port is already in use"), 'probe refuses to collide with an existing listener');
assert(script.includes('Get-ScheduledTaskInfo') && !script.includes('Start-ScheduledTask'), 'scheduled task inspection is read-only');
assert(!script.includes('schtasks.exe /End') && !script.includes('schtasks.exe /Run'), 'diagnostic never stops or starts production tasks');
assert(script.includes('dependencyMatches'), 'diagnostic compares approved and production dependency hashes');
assert(script.includes('Stop-Process -Id $probeProcess.Id'), 'isolated probe is always terminated');
assert(script.includes('@($probeStdout, $probeStderr)') && script.includes('Remove-Item -LiteralPath $path') &&
  script.includes('Remove-Item -LiteralPath $stagingRoot -Recurse -Force'),
  'temporary probe archive and logs are always removed');
assert(script.includes("'(?i)(token|password|cookie|api[_-]?key)"), 'diagnostic log output redacts credential-like values');

console.log('ALL PR382 STARTUP DIAGNOSTIC REQUEST CHECKS PASSED');

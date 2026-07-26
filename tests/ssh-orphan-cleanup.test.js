const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(
  path.join(root, 'ops/production/runtime/cleanup-orphaned-ssh-preauth.ps1'),
  'utf8',
);
const installer = fs.readFileSync(
  path.join(root, 'ops/production/install-ssh-orphan-cleanup-task.ps1'),
  'utf8',
);
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, 'ops/production/manifests/ssh-orphan-cleanup-20260726.json'),
    'utf8',
  ),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(runtime.includes("CommandLine -match '(?:^|\\s)-y(?:\\s|$)'"), 'runtime must target only -y children');
assert(runtime.includes('-not $knownPids.Contains'), 'runtime must require a missing parent process');
assert(runtime.includes('$minimumAgeSeconds = 60'), 'runtime must ignore young processes');
assert(runtime.includes("current.Name -ne 'sshd.exe'"), 'runtime must revalidate the process before killing');
assert(runtime.includes("current.CommandLine -notmatch '(?:^|\\s)-y(?:\\s|$)'"), 'runtime must revalidate -y');
assert(runtime.includes('Stop-Process -Id $candidatePid -Force'), 'runtime must kill only the revalidated PID');
assert(!runtime.includes('Stop-Service'), 'runtime must never stop sshd');
assert(!runtime.includes('Restart-Service'), 'runtime must never restart sshd');
assert(!runtime.includes('RemoteAddress'), 'runtime must not expose remote addresses');

assert(installer.includes('/SC MINUTE /MO 5'), 'cleanup must run every five minutes');
assert(installer.includes('/RU SYSTEM /RL HIGHEST'), 'cleanup task must run as SYSTEM');
assert(installer.includes('System.Management.Automation.Language.Parser'), 'runtime must pass syntax parsing');
assert(installer.includes("principal -notin @('SYSTEM', 'S-1-5-18')"), 'installer must verify SYSTEM principal');
assert(installer.includes("$interval -ne 'PT5M'"), 'installer must verify five-minute recurrence');
assert(installer.includes('task registration was rolled back'), 'installer must roll task registration back');
assert(installer.includes('panda-cloud-ops-2026-06-19.md'), 'installer must update cloud ops log');

assert(manifest.restart === 'none', 'runtime deployment must not restart website services');
assert(manifest.files.length === 1, 'manifest must deploy exactly one runtime file');
assert(
  manifest.files[0].destination === 'ops/cleanup-orphaned-ssh-preauth.ps1',
  'runtime destination must be stable',
);

console.log('SSH orphan cleanup tests passed');

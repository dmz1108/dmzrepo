const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(
  path.join(root, 'ops/production/harden-ssh-concurrency.ps1'),
  'utf8',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(script.includes("LoginGraceTime = '20'"), 'login grace period must be shortened');
assert(script.includes("MaxAuthTries = '3'"), 'authentication attempts must be bounded');
assert(script.includes("MaxStartups = '20:30:60'"), 'global startup capacity must be explicit');
assert(script.includes("PerSourceMaxStartups = '3'"), 'one source must not consume all startup slots');
assert(
  script.includes("KbdInteractiveAuthentication = 'no'"),
  'keyboard-interactive authentication must be disabled',
);
assert(script.includes('& $sshdPath -t -f $candidatePath'), 'candidate config must pass sshd -t');
assert(
  script.includes("foreach ($preservedKey in @('port', 'pubkeyauthentication', 'passwordauthentication'))"),
  'port and key/password authentication settings must be preserved',
);
assert(script.includes('Copy-Item -LiteralPath $configPath -Destination $backupPath'), 'config must be backed up');
assert(script.includes('[System.IO.File]::WriteAllBytes($configPath, $originalBytes)'), 'failure must restore exact bytes');
assert(script.includes("Restart-Service -Name sshd -Force"), 'sshd must restart to clear saturated sessions');
assert(script.includes('Wait-SshdReady -Port $port'), 'restart must verify the listener');
assert(script.includes('rollback=$rolledBack'), 'failure must report rollback status');
assert(script.includes("reason = 'already-applied'"), 'retries after restart must be idempotent');
assert(script.includes('listenerStartedAfterConfig'), 'idempotence must verify the running listener loaded the file');
assert(script.includes('panda-cloud-ops-2026-06-19.md'), 'cloud operations log must be updated');
assert(script.includes('_cloud-change-log-20260705.md'), 'cloud change log must be updated');
assert(!script.includes('New-NetFirewallRule'), 'hardening must not widen the firewall');
assert(!script.includes('RemoteAddress'), 'hardening output must not expose remote source addresses');

console.log('SSH concurrency hardening tests passed');

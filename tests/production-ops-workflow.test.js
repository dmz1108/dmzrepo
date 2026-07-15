const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const workflow = read('.github/workflows/production-ops.yml');
const deploy = read('ops/production/deploy-from-main.ps1');
const verify = read('ops/production/verify-access.ps1');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(workflow.includes('workflow_dispatch:'), 'production workflow must be manually dispatched');
assert(!workflow.includes('pull_request:'), 'production workflow must never run on pull requests');
assert(workflow.includes('environment: production'), 'production secrets must be environment protected');
assert(workflow.includes('refs/heads/main'), 'production workflow must reject non-main refs');
assert(workflow.includes('RUN_PRODUCTION'), 'production workflow must require explicit confirmation');
assert(workflow.includes('expected_sha256'), 'production workflow must pin the approved script hash');
assert(workflow.includes('StrictHostKeyChecking=yes'), 'production SSH must pin the host identity');
assert(workflow.includes('actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5'), 'checkout action must be commit pinned');
assert(workflow.includes('ops/production/'), 'operation scripts must be tracked under the approved directory');
assert(workflow.includes('archive_paths=("$MANIFEST_PATH")'), 'deployment archives must start from the reviewed manifest');
assert(workflow.includes('"${archive_paths[@]}"'), 'deployment archives must contain only manifest-selected files');
assert(workflow.includes('if [[ -n "$MANIFEST_PATH" ]]'), 'read-only and restart operations must not upload a source archive');
assert(workflow.includes('Symlink manifest sources are forbidden'), 'manifest-selected source files must reject symlinks');
assert(workflow.includes("& 'C:/Windows/Temp/${REMOTE_SCRIPT}'"), 'remote script path must expand before PowerShell execution');
assert(!workflow.includes("C:\\Windows\\Temp\\$REMOTE_SCRIPT"), 'backslashes must not escape remote path variables in bash');

assert(deploy.includes('_deploy-backups'), 'deployer must create rollback backups');
assert(deploy.includes('node --check'), 'deployer must validate staged JavaScript');
assert(deploy.includes('Wait-Health'), 'deployer must verify service health');
assert(deploy.includes('Copy-Item -LiteralPath $record.backupPath'), 'deployer must restore backups on failure');
assert(deploy.includes('duplicate manifest destination'), 'deployer must reject duplicate deployment targets');
assert(deploy.includes('$deploymentStarted -and $task'), 'pre-deployment validation failures must not stop services');
assert(deploy.includes('panda-cloud-ops-2026-06-19.md'), 'deployer must update the cloud operations log');
assert(deploy.includes('_cloud-change-log-20260705.md'), 'deployer must update the cloud change log');
assert(deploy.includes("'\\Panda Dashboard Server'"), 'main restart must use the scheduled task');

assert(verify.includes('isAdministrator'), 'access test must verify administrator membership');
assert(verify.includes('projectWriteAndDelete'), 'access test must verify project write/delete capability');
assert(verify.includes('runtimeDataDirsReadable'), 'access test must verify runtime database readability');

console.log('production ops workflow tests passed');

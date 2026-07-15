# Claude Production Access

Claude, Home Codex, and Company Codex can all perform production work. Claude's cloud environment uses an owner-approved GitHub workflow because the production SSH private key must not be placed in chat, Git, or a visible cloud environment variable.

## Capability

The workflow runs an approved PowerShell script on the cloud server as an administrator. Therefore an approved script can:

- inspect production files, processes, tasks, logs, and runtime databases;
- back up and deploy files from the exact approved `main` commit;
- restart the main, entertainment, Caddy, or consistency services;
- run source repair, database rebuild, and rollback operations;
- update cloud operation logs and verify public health.

The credential is stored only as encrypted secrets in the GitHub `production` environment. The workflow is restricted to `main`, has a single-operation concurrency lock, pins the SSH host key, records actor/commit/script hash, and requires the owner to approve the production environment run.

## Non-Negotiable Rules

1. Never ask for or print the SSH private key.
2. Never put a Token, Cookie, password, private key, user data, or runtime database in an operation script, manifest, PR, Actions output, or handoff.
3. Production scripts must be tracked under `ops/production/` and merged to `main` before execution.
4. Every run fixes the exact script with SHA-256. A hash mismatch fails before SSH.
5. Back up every file or database that will change.
6. Use a source archive from the workflow's exact `main` commit; do not download an unpinned branch inside the production script.
7. Restart only the required task, verify health, and roll back automatically on failed health.
8. Append safe results to both cloud operation logs and `docs/DAILY_HANDOFF.md`.
9. Delete one-off request scripts after their retention period through a later reviewed PR; Git history remains the audit record.

## Read-Only Access Test

From latest `main`:

```bash
script=ops/production/verify-access.ps1
sha=$(shasum -a 256 "$script" | awk '{print $1}')
gh workflow run production-ops.yml \
  --ref main \
  -f script_path="$script" \
  -f expected_sha256="$sha" \
  -f confirmation=RUN_PRODUCTION
```

Approve the waiting `production` environment deployment in GitHub. The run must report administrator identity, project write/delete capability, main scheduled-task visibility, runtime-directory readability, and Node availability. It creates and removes only a temporary probe file.

## Deploy Approved Files

1. Add or update a manifest under `ops/production/manifests/`.
2. Review and merge the code, manifest, and handoff into `main`.
3. Run `ops/production/deploy-from-main.ps1` with the manifest path:

```bash
git switch main
git pull --ff-only
script=ops/production/deploy-from-main.ps1
manifest=ops/production/manifests/example.json
sha=$(shasum -a 256 "$script" | awk '{print $1}')
gh workflow run production-ops.yml \
  --ref main \
  -f script_path="$script" \
  -f expected_sha256="$sha" \
  -f manifest_path="$manifest" \
  -f confirmation=RUN_PRODUCTION
```

The workflow uploads only the manifest and its listed source files, not the whole repository. The generic deployer backs up existing files, validates staged JavaScript, stops only the selected task, replaces all manifest files as one operation, restarts, checks local health, and restores the backup if verification fails. Read-only checks and restart-only operations upload no source archive.

## Database Or Special Maintenance

For operations that cannot be expressed as a file manifest:

1. Create `ops/production/requests/YYYY-MM-DD-short-task.ps1`.
2. Make the script idempotent, date-bound, backup-first, and explicit about validation.
3. Add focused tests when the operation depends on project logic.
4. Have another agent review the PR and merge it to `main`.
5. Compute the merged script SHA-256 and dispatch the workflow.
6. The owner approves the production environment run.
7. Verify production and update both Git and cloud logs.

Do not use a generic remote shell input or paste database JSON into workflow inputs. The reviewed script in `main` is the authorization record.

## Emergency Revocation

An owner can immediately revoke Claude production access by either:

- deleting the `DREAMERQI_CLAUDE_OPS_SSH_KEY` secret from the GitHub `production` environment; or
- removing the `claude-dreamerqi-ops` public key from the cloud SSH authorized-key file.

Rotate the key after suspected exposure and at least every 90 days.

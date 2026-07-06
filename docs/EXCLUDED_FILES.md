# Excluded Files

The cloud server has additional runtime files that should stay on the server and out of GitHub.

Typical excluded categories:

- account/session databases
- SMTP and sync credentials
- source site login cookies
- daily market/source data
- generated snapshots
- logs and backups
- node_modules
- tools runtime, Python runtime, Caddy binaries and downloaded installers
- temporary OCR/raw extraction files
- old zip/export packages

If Claude needs sample data later, create a tiny sanitized fixture instead of copying real runtime data.
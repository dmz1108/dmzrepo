# Production Request Scripts

Put one-off, reviewed production maintenance scripts in this directory.

Requirements:

- date-bound and idempotent;
- backup before every write;
- no embedded credentials or runtime data;
- explicit target paths and trading days;
- validation and rollback in the same script;
- safe output only;
- merge to `main`, calculate the merged script SHA-256, then run the protected production workflow.

Do not add a generic shell, arbitrary command input, or secret-printing helper.

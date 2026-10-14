# SnapText — Next Action

## Current status
Foundation web/API code and project documentation are on branch foundation/project-bootstrap. PostgreSQL schema, migration runner, connection pool, and readiness endpoint have been added. The new CI job now starts PostgreSQL and runs migrations before tests.

## Next concrete action
Inspect the latest GitHub Actions run. Fix any migration, readiness, typecheck, or build failures based on its logs. Then add a committed npm lockfile and switch CI to npm ci.

## Definition of done
- PostgreSQL service starts in CI.
- Initial migration applies successfully and is idempotent.
- API tests, typecheck, and production builds pass.
- Migration failure and checksum mismatch behavior are handled.
- CI uses a committed lockfile when available.
- Progress log records exact run links and results.

## After persistence baseline is verified
Implement batch creation and secure multi-image upload with actual file-type validation, checksums, private storage, and per-image status. Do not enable the UI upload button until API and storage tests pass.

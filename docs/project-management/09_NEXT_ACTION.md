# SnapText — Next Action

## Current status
Foundation code and project documentation are on branch foundation/project-bootstrap. The web preview and API health endpoint are implemented. Automated test/build results are not yet verified.

## Next concrete action
Open a pull request for foundation/project-bootstrap, inspect GitHub Actions, fix any actual failures, and add a lockfile so dependency installation is reproducible.

## Definition of done
- PR exists and CI completes.
- Unit tests, typecheck, and production builds pass with recorded run evidence.
- npm lockfile is committed and CI uses npm ci.
- Known gaps remain explicit; no production deployment is claimed.

## After foundation is verified
Implement Phase 1 persistence: PostgreSQL schema/migrations and repository/service contracts for batches, source images, schemas, records, field values, provenance, conflicts, and usage.

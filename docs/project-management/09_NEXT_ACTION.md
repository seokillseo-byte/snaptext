# SnapText — Next Action

## Current status
The foundation, PostgreSQL schema/migration, workspace and batch creation, multi-image upload, server-side image signature validation, SHA-256 duplicate detection, private local storage, disk-backed multipart staging, upload UI, and PostgreSQL repository contract are implemented on foundation/project-bootstrap. GitHub Actions run 79 passed migration, API tests, typecheck, and build. The newest workflow additionally applies migrations twice to verify idempotence; await its result.

## Immediate next action
1. Confirm the newest GitHub Actions run is green, including the repeated migration.
2. Add tests for total request size limits and temporary-file cleanup after parser errors.
3. Commit an npm lockfile and switch CI to npm ci.
4. Add workspace/batch/image list and detail endpoints with pagination and persistence tests.
5. Add authentication and workspace authorization before any staging/public exposure.
6. Prepare synthetic/licensed Vietnamese and English sample images and benchmark PaddleOCR versus Tesseract before choosing the OCR engine.

## Definition of done
- CI passes migration twice, API tests, typecheck, and frontend/backend builds.
- Upload limits and temporary-file cleanup are tested.
- Workspace/batch/image reads are paginated and covered by repository/service/API tests.
- Secrets remain out of the repository and local image storage remains private.
- Authentication/authorization is in place before a public deployment.
- OCR selection is based on measured quality/latency rather than assumptions.

## Later phases
After persistence and upload hardening: local OCR → schema-driven extraction → budget-controlled AI fallback → review/edit → non-destructive duplicate/conflict resolution → unified CSV/XLSX export.

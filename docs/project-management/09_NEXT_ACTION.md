# SnapText — Next Action

## Current status
The foundation, PostgreSQL schema/migration, workspace and batch creation, multi-image upload, server-side image signature validation, SHA-256 duplicate detection, private permanent storage, disk-backed multipart staging, upload UI, and PostgreSQL repository contract are implemented on foundation/project-bootstrap. GitHub Actions run 84 passed migration twice, API tests, TypeScript checks, and production build.

## Immediate next action
1. Verify the new integration tests for combined upload-size rejection and temporary-file cleanup.
2. Commit an npm lockfile and switch CI to npm ci.
3. Add workspace, batch, and image list/detail endpoints with pagination and persistence tests.
4. Add authentication and workspace authorization before any staging/public exposure.
5. Prepare synthetic/licensed Vietnamese and English sample images and benchmark PaddleOCR versus Tesseract before choosing the OCR engine.

## Definition of done
- Request-size limits and temporary-file cleanup are tested.
- CI installs reproducibly with a committed lockfile, then passes migrations twice, API tests, typecheck, and frontend/backend builds.
- Workspace/batch/image reads are paginated and covered by repository/service/API tests.
- Secrets remain out of the repository and local image storage remains private.
- Authentication/authorization is in place before a public deployment.
- OCR selection is based on measured quality and latency rather than assumptions.

## Later phases
After persistence and upload hardening: local OCR → schema-driven extraction → budget-controlled AI fallback → review/edit → non-destructive duplicate/conflict resolution → unified CSV/XLSX export.

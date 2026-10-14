# SnapText — Next Action

## Current status
The foundation, PostgreSQL schema/migration, workspace and batch creation, multi-image upload, private storage, and paginated workspace/batch/image read APIs are implemented on `foundation/project-bootstrap`. Integration coverage exercises persisted pagination, detail retrieval, parent scoping, invalid pagination, and storage-key privacy. A genuine npm-generated `package-lock.json` is committed, and CI now uses `npm ci`. GitHub Actions run 119 passed migration twice, API tests, TypeScript checks, and build after the read API changes; the final `npm ci` workflow run is pending.

## Immediate next action
1. Confirm the current `npm ci` GitHub Actions run passes migrations twice, API tests, typecheck, and production builds.
2. Add authentication and workspace authorization before any staging/public exposure.
3. Prepare synthetic/licensed Vietnamese and English sample images and benchmark PaddleOCR versus Tesseract before choosing the OCR engine.

## Definition of done
- CI installs reproducibly with the committed lockfile, then passes migrations twice, API tests, typecheck, and frontend/backend builds.
- Workspace/batch/image reads are paginated and covered by repository/service/API tests.
- Secrets remain out of the repository and local image storage remains private.
- Authentication/authorization is in place before a public deployment.
- OCR selection is based on measured quality and latency rather than assumptions.

## Later phases
After persistence and upload hardening: local OCR → schema-driven extraction → budget-controlled AI fallback → review/edit → non-destructive duplicate/conflict resolution → unified CSV/XLSX export.

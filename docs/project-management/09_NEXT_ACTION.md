# SnapText — Next Action

## Current status
The foundation, PostgreSQL schema/migration, workspace and batch creation, multi-image upload, server-side image signature validation, SHA-256 duplicate detection, private permanent storage, disk-backed multipart staging, upload UI, and paginated workspace/batch/image read APIs are implemented on `foundation/project-bootstrap`. Integration coverage now exercises persisted pagination, details, parent scoping, invalid pagination, and storage-key privacy. The latest successful validation before these read APIs was GitHub Actions run 94; the read API changes still require a fresh CI result.

## Immediate next action
1. Obtain a genuine npm-generated `package-lock.json` and switch CI from `npm install` to `npm ci`. Do not hand-author or fabricate dependency resolutions.
2. Run the full GitHub Actions workflow on the current branch and fix any failures.
3. Add authentication and workspace authorization before any staging/public exposure.
4. Prepare synthetic/licensed Vietnamese and English sample images and benchmark PaddleOCR versus Tesseract before choosing the OCR engine.

## Definition of done
- CI installs reproducibly with a committed lockfile, then passes migrations twice, API tests, typecheck, and frontend/backend builds.
- Workspace/batch/image reads are paginated and covered by repository/service/API tests.
- Secrets remain out of the repository and local image storage remains private.
- Authentication/authorization is in place before a public deployment.
- OCR selection is based on measured quality and latency rather than assumptions.

## Later phases
After persistence and upload hardening: local OCR → schema-driven extraction → budget-controlled AI fallback → review/edit → non-destructive duplicate/conflict resolution → unified CSV/XLSX export.

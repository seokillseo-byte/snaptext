# SnapText — Progress Log

## 2026-10-14 — Foundation, PostgreSQL, and upload workflow
- Initialized the project in repository seokillseo-byte/snaptext on branch foundation/project-bootstrap.
- Added project charter, master plan, architecture, roadmap, backlog, decision log, risk register, test strategy, progress log, and next-action handoff.
- Added React + TypeScript + Vite UI, Express API, health/readiness endpoints, PostgreSQL pool, checksum-verified SQL migration runner, initial schema, and local PostgreSQL Compose service.
- GitHub Actions run 37 passed: PostgreSQL startup, migration, API tests, typecheck, and build: https://github.com/seokillseo-byte/snaptext/actions/runs/38539095776
- Added workspace and batch creation endpoints.
- Added multi-image upload API with server-side image signature validation (PNG/JPEG/WEBP/GIF/TIFF/BMP), SHA-256, private storage using server-generated names, per-image records, and exact-content duplicate reporting.
- Multipart files use private temporary disk storage; configurable limits cover file count, per-file size, and combined request size. Temporary files are removed before the upload response is returned.
- Added BatchRepository contract and PostgreSQL implementation; service-layer SQL was moved into the repository.
- Connected the React upload form to workspace/batch creation and multi-image upload; the UI displays accepted and rejected outcomes.
- GitHub Actions run 79 passed migration, API tests, typecheck, and build for the upload/repository implementation: https://github.com/seokillseo-byte/snaptext/actions/runs/38584564365
- GitHub Actions run 84 passed both migration executions (idempotence check), API tests, TypeScript checks, and production build: https://github.com/seokillseo-byte/snaptext/actions/runs/38585487150
- Added an integration test forcing the combined request-size limit and verifying that no image rows persist and temporary files are removed. The first run exposed a response/cleanup race; the route was corrected to await cleanup before returning the 413 response.
- Latest validation run 93 passed migrations twice, all API tests (including upload limit and cleanup), typecheck, and production build: https://github.com/seokillseo-byte/snaptext/actions/runs/38586320140


## 2026-10-14 — Paginated read APIs
- Added repository contracts and PostgreSQL queries for listing/detail retrieval of workspaces, batches, and source images.
- Added API endpoints: `GET /api/workspaces`, `GET /api/workspaces/:workspaceId`, `GET /api/workspaces/:workspaceId/batches`, `GET /api/workspaces/:workspaceId/batches/:batchId`, `GET /api/workspaces/:workspaceId/batches/:batchId/images`, and `GET /api/workspaces/:workspaceId/batches/:batchId/images/:imageId`.
- List endpoints support bounded `page` and `pageSize` pagination and return total/totalPages metadata. IDs and parent-child scope are checked; storage keys are not returned by read APIs.
- Added PostgreSQL integration coverage for persisted pagination, detail retrieval, workspace/batch scope, invalid pagination, and storage-key privacy.
- Validation status: changes were authored directly on GitHub; a fresh GitHub Actions result is still pending. No local runtime tests were run in this session.
- Generated a genuine npm lockfile through npm install on GitHub Actions and committed it to the branch. CI now uses npm ci and npm's cache support; GitHub Actions run 134 passed the final `npm ci` workflow: migrations ran twice, API tests passed, TypeScript checks passed, and production builds passed.

## Known gaps and safety limits
- No authentication or workspace authorization exists yet. Do not expose the service publicly or upload sensitive/production data.
- Combined request-size validation occurs after multipart files have been staged to private temporary disk storage. Per-file and file-count caps bound staging usage, but production deployment still needs operational disk monitoring and rate limiting.
- A genuine npm-generated package-lock.json is committed; CI now uses npm ci.
- OCR, AI fallback, schema-driven extraction, review/edit, record-level duplicate/conflict resolution, and combined CSV/XLSX export are not implemented.
- No local runtime tests were executed in this chat session; validation evidence comes from GitHub Actions.

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action

# SnapText — Progress Log

## 2026-10-14 — Foundation, PostgreSQL, and upload workflow
- Initialized the project in repository seokillseo-byte/snaptext on branch foundation/project-bootstrap.
- Added project charter, master plan, architecture, roadmap, backlog, decision log, risk register, test strategy, progress log, and next-action handoff.
- Added React + TypeScript + Vite UI, Express API, health/readiness endpoints, PostgreSQL pool, checksum-verified SQL migration runner, initial schema, and local PostgreSQL Compose service.
- GitHub Actions run 37 passed: PostgreSQL startup, migration, API tests, typecheck, and build: https://github.com/seokillseo-byte/snaptext/actions/runs/38539095776
- Added workspace and batch creation endpoints.
- Added multi-image upload API with server-side image signature validation (PNG/JPEG/WEBP/GIF/TIFF/BMP), SHA-256, private storage using server-generated names, per-image records, and exact-content duplicate reporting.
- Multipart files use private temporary disk storage; configurable limits cover file count, per-file size, and combined request size. Temporary files are removed after processing.
- Added BatchRepository contract and PostgreSQL implementation; service-layer SQL was moved into the repository.
- Added integration coverage for a valid PNG, fake image content, duplicate content, and persisted batch image count.
- Connected the React upload form to workspace/batch creation and multi-image upload; the UI displays accepted and rejected outcomes.
- GitHub Actions run 79 passed migration, API tests, typecheck, and build for the upload/repository implementation: https://github.com/seokillseo-byte/snaptext/actions/runs/38584564365
- A later workflow revision initially failed before job startup because runner.temp was referenced in job-level environment variables. The workflow was corrected to use configured private relative paths.
- GitHub Actions run 84 passed both migration executions (idempotence check), API tests, TypeScript checks, and production build: https://github.com/seokillseo-byte/snaptext/actions/runs/38585487150

## Known gaps and safety limits
- No authentication or workspace authorization exists yet. Do not expose the service publicly or upload sensitive/production data.
- Combined request-size validation occurs after multipart files have been staged to private temporary disk storage. Per-file and file-count caps bound staging usage, but production deployment still needs operational disk monitoring and rate limiting.
- npm lockfile has not been committed; CI currently uses npm install.
- OCR, AI fallback, schema-driven extraction, review/edit, record-level duplicate/conflict resolution, and combined CSV/XLSX export are not implemented.
- No local runtime tests were executed in this chat session; validation evidence comes from GitHub Actions.

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action

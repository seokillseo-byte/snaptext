# SnapText — Progress Log

## 2026-10-14 — Foundation, PostgreSQL, and upload workflow
- Initialized the project in repository seokillseo-byte/snaptext on branch foundation/project-bootstrap.
- Added project charter, master plan, architecture, roadmap, backlog, decision log, risk register, test strategy, progress log, and next-action handoff.
- Added React + TypeScript + Vite UI, Express API, health/readiness endpoints, PostgreSQL pool, SQL migration runner with SHA-256 migration checksums, and initial schema.
- GitHub Actions run 37 passed: PostgreSQL service startup, migration, API tests, typecheck, and production build: https://github.com/seokillseo-byte/snaptext/actions/runs/38539095776
- Added workspace and batch creation endpoints.
- Added multi-image upload API with multipart limits, content-signature validation (PNG/JPEG/WEBP/GIF/TIFF/BMP), SHA-256 hashes, private local storage using server-generated filenames, per-image database records, and duplicate-content reporting.
- Added an integration test covering upload of a PNG, rejection of fake image content, duplicate detection, and persisted image count.
- Connected the React upload form to create a workspace and batch and display accepted/rejected file outcomes.
- Added .snaptext-data/ to .gitignore and local API usage documentation.
- The latest CI runs for upload and UI changes are still in progress at the time of this entry; do not claim them as passed until a completed run confirms success.

## Known gaps and safety limits
- No authentication or workspace authorization exists yet. Do not expose the service publicly or use sensitive/production data.
- Multer currently buffers uploaded files in memory. A total request-size limit or streaming/disk-backed multipart implementation is still required before public deployment.
- The service currently contains SQL operations directly; repository abstraction/persistence tests are a follow-up task.
- OCR, AI fallback, schema-driven extraction, review/edit, record-level deduplication/conflict resolution, and combined CSV/XLSX export are not implemented.
- npm lockfile has not been committed; CI currently uses npm install.
- No local runtime tests were executed in this chat session.

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action

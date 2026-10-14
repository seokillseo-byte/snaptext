# SnapText — Task Backlog

## P0 Foundation
- [x] Verify repository and branch baseline.
- [x] Add project charter, master plan, architecture, roadmap, decision log, risks, quality plan, progress log, and next-action handoff.
- [x] Add React + TypeScript + Vite web app and Express API.
- [x] Add GitHub Actions for install, migration, tests, typecheck, and build.
- [ ] Generate and commit npm lockfile; switch CI to npm ci.

## P1 Persistence and upload
- [x] Add initial PostgreSQL schema for workspaces, extraction schemas, batches, images, records, fields, duplicate candidates, conflicts, and usage events.
- [x] Add checksum-verified SQL migration runner and PostgreSQL readiness endpoint.
- [x] Verify migration, API tests, typecheck, and build in GitHub Actions.
- [x] Define BatchRepository interface and PostgreSQL repository implementation.
- [x] Add workspace and batch creation endpoints.
- [x] Add multi-image upload with server-side signature detection, SHA-256, private local storage, per-image status, and duplicate-content reporting.
- [x] Use private temporary disk storage for multipart files rather than buffering all uploads in memory.
- [x] Enforce configurable file count, per-file size, and combined request size limits.
- [x] Add integration test for valid PNG, fake image content, duplicate content, and persisted batch count.
- [x] Add integration test for combined request-size rejection and temporary-file cleanup.
- [x] Connect web upload form to workspace, batch, and image APIs.
- [ ] Add pagination/list/detail endpoints for workspaces, batches, and images.
- [ ] Add authentication and workspace authorization before any public/staging exposure.

## P2 OCR and extraction
- [ ] Prepare synthetic/licensed benchmark images covering Vietnamese and English layouts.
- [ ] Benchmark PaddleOCR and Tesseract for target languages/layouts.
- [ ] Implement selected OCR adapter and schema-driven extraction.
- [ ] Measure CER/WER and field accuracy; publish measured results.

## P3 AI fallback
- [ ] Define fallback thresholds from observed OCR quality.
- [ ] Add provider interface and mocked provider.
- [ ] Add budgets, bounded retries, and usage audit.
- [ ] Test budget exhaustion and provider failure.

## P4 Review and export
- [ ] Build review/edit UI and persist edits.
- [ ] Add non-destructive duplicate candidates and conflict resolution audit.
- [ ] Generate combined CSV and XLSX.
- [ ] Test Unicode, empty cells, row consistency, and formula injection.

## P5 Release readiness
- [ ] Add end-to-end tests.
- [ ] Write benchmark and deployment guides.
- [ ] Add staging deployment and smoke test with GitHub secrets.
- [ ] Validate backup/restore and operational limits.

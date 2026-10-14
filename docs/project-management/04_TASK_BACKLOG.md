# SnapText — Task Backlog

## P0 Foundation
- [x] Verify repository settings/default branch.
- [x] Add project documentation and decision log.
- [x] Add CI for install, tests, typecheck, and build.
- [x] Add minimal frontend and API health endpoint.
- [x] Add automated tests for API health.
- [x] Add environment example and ignore secrets.
- [x] Document local development.
- [ ] Commit npm lockfile and switch CI to npm ci.

## P1 Persistence and upload
- [x] Add initial PostgreSQL schema for workspaces, schemas, batches, images, records, fields, duplicate candidates, conflicts, and usage events.
- [x] Add checksum-verified SQL migration runner.
- [x] Add database connection pool and readiness endpoint.
- [ ] Verify migrations against PostgreSQL in GitHub Actions.
- [ ] Add repository/service contracts and persistence tests.
- [ ] Implement upload validation and private storage adapter.
- [ ] Add batch/image upload and status endpoints.
- [ ] Test file limits, actual MIME types, checksums, and partial failure.

## P2 OCR and extraction
- [ ] Prepare synthetic/licensed benchmark images.
- [ ] Benchmark PaddleOCR and Tesseract for target languages/layouts.
- [ ] Implement chosen OCR adapter and schema-driven extraction.
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
- [ ] Add integration/end-to-end tests.
- [ ] Write benchmark and deployment guides.
- [ ] Add staging deployment and smoke test with GitHub secrets.
- [ ] Validate backup/restore and operational limits.

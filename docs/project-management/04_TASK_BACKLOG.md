# SnapText — Task Backlog

## P0 Foundation
- [ ] Verify repository settings/default branch.
- [ ] Add project documentation and decision log.
- [ ] Add CI for install, lint/typecheck, tests, and build.
- [ ] Add minimal frontend and API health endpoint.
- [ ] Add automated tests for the health endpoint.
- [ ] Add environment example and ignore secrets.
- [ ] Document local development.

## P1 Persistence and upload
- [ ] Select database library and migration strategy.
- [ ] Add migrations for batches, images, schemas, records, fields, provenance, conflicts, and usage.
- [ ] Implement upload validation and private storage adapter.
- [ ] Add batch/image status endpoints.
- [ ] Test limits, invalid MIME types, checksums, and partial failure.

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

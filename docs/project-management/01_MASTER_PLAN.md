# SnapText — Master Plan

## Phase 0 — Repository foundation
- Project docs, decision records, branch/PR workflow, CI.
- Minimal runnable frontend/API and tests.
- Environment example and secret-handling rules.
- Exit: reproducible install/build/test workflow.

## Phase 1 — Persistence
- Model batches, images, schemas, records, fields, provenance, duplicate candidates, conflicts, usage events.
- PostgreSQL migrations; route handlers delegate to services.
- Exit: migrations and repository tests verify constraints.

## Phase 2 — Upload and orchestration
- Validate file count, MIME type, size, and safe filenames.
- Store originals behind a private storage adapter.
- Track images independently; make retries bounded and idempotent.
- Exit: multi-image upload and failure isolation.

## Phase 3 — Local OCR and extraction
- Benchmark PaddleOCR and Tesseract on representative target images before selecting.
- Normalize OCR output to a provider-independent contract.
- Extract schema fields conservatively; missing/uncertain values remain explicit.
- Exit: adapter tests and reproducible benchmark report.

## Phase 4 — AI fallback and budgets
- Define measurable fallback criteria.
- Add provider adapter, timeouts, bounded retries, and per-batch/global budgets.
- Mock AI calls in CI.
- Exit: tests prove fallback only runs when eligible and budget permits.

## Phase 5 — Review, normalization, matching
- Editable structured rows, field-level uncertainty, provenance.
- Field-aware normalization.
- Surface duplicate candidates and conflicts for human decisions.
- Exit: safe non-destructive behavior is tested.

## Phase 6 — Combined exports
- Export one combined XLSX and CSV per batch.
- Test Unicode, empty fields, row consistency, and spreadsheet formula injection.
- Exit: generated files parse and match expected data.

## Phase 7 — Quality and operations
- Integration/end-to-end tests and repeatable benchmark.
- Document backup, restore, migrations, limits, logging, deployment.
- Add staging deployment and smoke tests without exposing secrets.
- Exit: release checklist and verified staging evidence.

Dependency order: foundation → persistence → upload → OCR/extraction → AI fallback → review/matching → exports → staging hardening.
Do not deploy production or enable paid AI by default. A phase is not complete without evidence.

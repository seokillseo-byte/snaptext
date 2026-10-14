# SnapText — Test and Quality Strategy

## Test layers
1. Static checks: lint, typecheck, dependency/build checks.
2. Unit tests: validation, normalization, budgets, duplicate rules, export sanitization.
3. Integration tests: API + PostgreSQL, storage adapter, migrations/repositories.
4. OCR tests: deterministic fixtures and adapter contracts.
5. AI fallback tests: mocked provider; threshold, timeout, retry, budget exhaustion, failures.
6. End-to-end: upload → process → review/edit → resolve flags → combined export.
7. Staging smoke tests: UI/API, database connectivity, upload and export using synthetic data.

## Quality metrics
- Character error rate (CER) and word error rate (WER), when ground truth exists.
- Field extraction accuracy and valid-record ratio.
- Duplicate candidate precision and false-merge rate; destructive automatic merge target is zero.
- AI fallback rate and estimated cost per image/batch.
- Processing p50/p95 latency and failure/retry rates.
- Export row/field correctness.

## Evidence rules
Never publish metrics before running a benchmark. Use synthetic or licensed images. CI must not require a real paid AI key. A green unit suite does not prove staging or production readiness.

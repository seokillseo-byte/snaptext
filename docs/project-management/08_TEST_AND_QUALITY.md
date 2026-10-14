# SnapText — Test and Quality Strategy

## Test layers
1. Static checks: lint, typecheck, dependency/build checks.
2. Identity/security: registration validation, password hashing, verification/reset expiry and replay, login throttling, session rotation/revocation, cookie/CSRF behavior.
3. Tenant authorization: prove anonymous denial and cross-tenant read/write denial for each workspace, batch, image, record, export, usage and subscription endpoint.
4. Billing: plan/interval validation, subscription transitions, UTC boundaries, idempotency, webhook signature verification, replay/out-of-order event handling.
5. Quota: atomic reservation/settlement, concurrent requests, failure release, period reset, exhaustion, and no client-side bypass.
6. Unit tests: normalization, OCR thresholds, budget logic, duplicate rules, export sanitization.
7. Integration tests: API + PostgreSQL, storage adapter, migrations/repositories.
8. OCR tests: deterministic fixtures and adapter contracts.
9. AI fallback tests: mocked provider; threshold, timeout, retry, budget exhaustion, failures.
10. End-to-end: signup → verify → login → plan → sandbox payment → quota → upload → process → review/edit → combined export.
11. Staging smoke tests: synthetic data only; no exposure until identity and tenant-isolation gates pass.

## Quality metrics
- Security: zero cross-tenant data access in tests; no token/secret leakage in logs.
- Billing: duplicate webhooks never duplicate entitlement changes or quota grants.
- OCR: CER/WER, field extraction accuracy, valid-record ratio.
- Matching: duplicate candidate precision and false-merge rate; destructive automatic merge target is zero.
- Operations: AI fallback rate/cost per image/batch, p50/p95 latency, failure/retry rates.
- Export: row/field correctness and spreadsheet formula-injection safety.

## Evidence rules
Never publish metrics before running a benchmark. Use synthetic or licensed images. CI must not require a real paid AI key or live payment transaction. A green unit suite does not prove staging or production readiness.
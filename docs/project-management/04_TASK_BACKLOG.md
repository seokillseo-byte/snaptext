# SnapText — Task Backlog

## P0 — Foundation (implemented on Draft PR)
- [x] Project docs, React + TypeScript + Vite, Express + TypeScript, PostgreSQL, migrations and CI.
- [x] Workspace/batch creation, private multi-image upload, per-image status and duplicate-content reporting.
- [x] Bounded upload limits and private temporary staging with cleanup tests.
- [x] Paginated workspace/batch/image list and detail APIs with scope/privacy tests.
- [x] Genuine npm lockfile and npm ci in CI; passing workflow evidence recorded.

## P0 — Phase 1: SaaS identity and tenant isolation (in progress)
- [x] Inspect current dependencies, migrations, route/service/repository conventions, frontend routing, and test fixtures.
- [ ] Record ADR for maintained auth/session library, email verification and password-reset approach.
- [x] Add users, workspace memberships/roles, sessions, hashed verification/reset tokens, and audit events in migration 002.
- [x] Implement API endpoints for register, email verification, login/logout, password reset, and session revocation on password reset.
- [ ] Add auth middleware and workspace authorization; client-provided IDs must not establish ownership.
- [x] Scope workspace listing to membership and protect existing workspace/batch/image routes with membership checks.
- [ ] Add rate limits, secure cookie/CSRF strategy, security headers, safe config examples, and no-secret logging.
- [x] Add integration tests for anonymous denial, registration/verification replay, login/logout, and cross-tenant workspace read/write denial.
- [ ] Add expiry/replay coverage for password reset and expired sessions; confirm current CI passes.
- [x] Update README, progress log, next-action handoff, and PR description.
- [ ] Verify latest GitHub Actions run and fix any failures.

## Phase 1 blocker
- [ ] Select/configure an email delivery provider behind EmailSender; current implementation fails closed when no provider is configured, so customer signup cannot complete until this is done.

## P0 — Phase 2: Subscription and quotas
- [ ] Define configurable plan/limit fields without inventing prices or customer-facing quota values.
- [ ] Add versioned plans/prices, monthly/yearly intervals, subscription states, usage ledger, quota reservation/settlement.
- [ ] Test atomic/concurrent quota checks, UTC periods, cancellation, past-due, expiry, failure release and exhaustion.
- [ ] Expose plan/usage API and enforce entitlements server-side.

## P0 — Phase 3: Automated gateway
- [ ] Compare merchant eligibility, VND/local methods, recurring support, signed webhooks, refunds, sandbox and fees.
- [ ] Record gateway-selection ADR and obtain owner approval before provider-specific implementation.
- [ ] Implement hosted checkout, signature-verified durable webhook inbox, idempotent processing and reconciliation.
- [ ] Test replay/out-of-order events in sandbox; never grant entitlements from client redirects alone.

## P1 — Customer experience and processing
- [ ] Signup/onboarding and dashboard with plan/usage, subscription state, batch history and clear quota errors.
- [ ] Prepare synthetic/licensed Vietnamese and English OCR fixtures.
- [ ] Benchmark PaddleOCR vs Tesseract and publish measured CER/WER, field accuracy and latency.
- [ ] Implement schema-driven extraction and local OCR adapter.
- [ ] Add budget-controlled AI fallback with mocked provider tests.
- [ ] Build record/field review, persistent edits, provenance, duplicate/conflict review.
- [ ] Generate consolidated CSV/XLSX and test Unicode, consistency and formula injection.

## P1 — Release readiness
- [ ] E2E signup → plan → sandbox payment → quota → upload → process → review → export.
- [ ] Add operational logs/metrics, backup/restore, privacy/retention and incident docs.
- [ ] Staging only after tenant isolation passes; production deployment only after explicit owner approval.
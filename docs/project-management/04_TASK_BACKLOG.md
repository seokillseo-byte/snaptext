# SnapText — Task Backlog

## P0 — Foundation (implemented on Draft PR)
- [x] Project docs, React + TypeScript + Vite, Express + TypeScript, PostgreSQL, migrations and CI.
- [x] Workspace/batch creation, private multi-image upload, per-image status and duplicate-content reporting.
- [x] Bounded upload limits and private temporary staging with cleanup tests.
- [x] Paginated workspace/batch/image list and detail APIs with scope/privacy tests.
- [x] Genuine npm lockfile and npm ci in CI; passing workflow evidence recorded.

## P0 — Phase 1: SaaS identity and tenant isolation (in progress)
- [x] Inspect current dependencies, migrations, route/service/repository conventions, frontend routing, and test fixtures.
- [x] Record ADR for the identity/session, email-verification, and password-reset approach.
- [x] Add users, workspace memberships/roles, sessions, hashed verification/reset tokens, and audit events in migration 002.
- [x] Implement API endpoints for register, email verification, login/logout, password-reset request/confirmation, and session revocation on password reset.
- [x] Add customer signup, login, email verification, password-reset request/confirmation, and sign-out screens.
- [x] Add auth middleware and workspace authorization; client-provided IDs must not establish ownership.
- [x] Scope workspace listing to membership and protect existing workspace/batch/image routes with membership checks.
- [x] Add per-IP/per-route auth throttling, HttpOnly/SameSite cookies, same-origin checks, security headers, safe config examples, and avoid token values in API responses; distributed throttling and deployment review remain open.
- [x] Add integration tests for anonymous denial, registration/verification replay, login/logout, and cross-tenant workspace read/write denial.
- [x] Add integration tests for password-reset replay, session expiry, registration/verification, login/logout, and cross-tenant workspace access.
- [x] Add integration tests proving expired password-reset and email-verification tokens are rejected; review audit/error behavior further before release.
- [x] Update README, progress log, next-action handoff, and PR description.
- [x] Verify latest GitHub Actions run for Resend integration and expiry-test changes; run 287 passed.
- [x] Bound process-local auth rate-limiter memory with periodic expiry pruning and a hard entry cap; add deterministic unit tests (PR #3, CI run 287 passed).
- [ ] Validate the new cookie-authenticated Origin requirement with CI and reverse-proxy configuration tests.
- [ ] Add cross-tenant image read/list/upload regression tests; run CI and verify all cross-tenant batch tests pass.
- [ ] Audit remaining workspace/batch/image repository queries and trusted-proxy Origin behavior.
- [ ] Replace process-local throttling with shared storage before multi-instance production deployment.

## Phase 1 email delivery status
- [x] Implement Resend HTTPS email adapter behind EmailSender using `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; no API key is stored in the repository.
- [x] Add adapter tests for request payload/auth header, provider failures, network failures, and secret-safe errors; include service tests in the CI test command.
- [x] Document environment configuration and verified-sender requirement.
- [x] Add a safe manual smoke-test script that sends a harmless message to `RESEND_TEST_TO_EMAIL` without logging credentials or account tokens.
- [ ] Configure secrets in the runtime environment, verify the sender domain, and run the smoke test plus controlled registration/password-reset end-to-end checks.
- [ ] Complete auth security review and confirm passing CI before Phase 1 release readiness.

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
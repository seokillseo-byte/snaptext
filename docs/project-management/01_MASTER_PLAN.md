# SnapText — Master Plan

## Confirmed product decisions
Customer-facing multi-tenant SaaS; self-service signup; monthly/yearly subscriptions with plan limits; automated gateway payment. No manual signup approval or wallet/credits in v1. Gateway, prices, quotas, and commercial policies remain unselected until evidence and owner approval.

## Phase 0 — Repository foundation (implemented; CI evidence recorded)
React + TypeScript + Vite, Express + TypeScript, PostgreSQL, checksum-verified migrations, CI, workspace/batch creation, private multi-image upload, paginated workspace/batch/image APIs.
Exit: reproducible install, migration, test, typecheck, and build.

## Phase 1 — Identity and tenant security (next, P0)
- Inspect dependencies, routes/services/repositories, migrations, frontend routing, and tests.
- Choose a maintained auth/session approach; document ADR.
- Add users, workspace memberships/roles, sessions, hashed verification/reset tokens, and audit events.
- Implement self-service registration, email verification, login/logout, password reset, session rotation/revocation, rate limits, and safe cookie/CSRF strategy.
- Resolve workspace access from authenticated identity; apply authorization to all existing APIs.
Exit: anonymous denial and cross-tenant read/write denial tests for every resource family; no tokens/secrets in logs.

## Phase 2 — Plans, subscriptions, and quota enforcement (P0)
Define versioned plans, monthly/yearly periods, image/batch/storage/AI limits, subscription lifecycle, usage ledger, atomic reservation/settlement, and failure release. Do not invent prices or limits.
Exit: tests for UTC period boundaries, cancellation/expired/past-due states, duplicate requests, concurrent quota races, and exhaustion.

## Phase 3 — Automated payments (P0 after Phase 2)
Compare gateway merchant eligibility, VND/local methods, recurring support, signed webhooks, refunds, fees, sandbox. Record an ADR and obtain owner approval. Implement hosted checkout, verified signature handling, durable idempotent webhook inbox, reconciliation, and sandbox tests.
Exit: replay-safe verified sandbox matrix. Never activate paid entitlements from a browser redirect alone.

## Phase 4 — Customer SaaS dashboard
Signup/onboarding, plan and usage display, batch history, account settings, subscription management, clear quota/error states.
Exit: end-to-end onboarding and usage tests.

## Phase 5 — OCR and extraction
Prepare synthetic/licensed Vietnamese and English fixtures; benchmark PaddleOCR vs Tesseract; publish CER/WER, field accuracy, latency, hardware/environment; implement provider-independent OCR and schema extraction.
Exit: reproducible measured benchmark and adapter tests.

## Phase 6 — AI fallback
Measured eligibility thresholds, provider adapter, timeouts, bounded retries, usage/cost accounting, account/batch/platform budgets; mock paid providers in CI.
Exit: fallback only when eligible and budget allows.

## Phase 7 — Review and matching
Editable records, provenance, uncertainty, normalization, duplicate candidates and conflict decisions; no silent merge/delete.

## Phase 8 — Combined exports
One combined CSV/XLSX per batch, Unicode/empty-cell consistency, formula-injection safety, entitlement checks.

## Phase 9 — Release readiness
E2E, observability, abuse/rate limits, backup/restore, privacy/retention, staging smoke tests, gateway reconciliation, runbooks and release checklist. No staging before auth/tenant gates; no production deployment without explicit approval.

## Dependency order
Foundation → identity/tenant security → plans/quotas → gateway/webhooks → SaaS dashboard → OCR → AI fallback → review → export → release readiness.

## Definition of done
Each phase has migrations where needed, appropriate tests, CI evidence, updated backlog/progress/decision/risk/next-action docs, and explicit gaps. Never merge or deploy without explicit owner instruction.
# SnapText — Architecture

## Product shape
Multi-tenant, customer-facing SaaS. Users may belong to one or more workspaces. Each workspace owns batches, images, records, exports, usage, and subscription/entitlements. A client-supplied workspace ID is a selector, never proof of permission.

## Layers
- Web: React + TypeScript + Vite; public auth, onboarding, workspace dashboard, batch review/export, plan/usage, subscription management, and platform admin.
- API: Node.js + TypeScript + Express. Routes validate transport; services own policy/orchestration; repository interfaces isolate persistence; PostgreSQL repositories own SQL.
- Identity/security: maintained password hashing, secure sessions, hashed one-time verification/reset tokens, rotation/revocation, appropriate CSRF protection, rate limits, audit events.
- Domain services: tenant authorization, plan catalog, subscription lifecycle, entitlement resolution, quota reservation/settlement, payment reconciliation, batch processing, review/export.
- Persistence: PostgreSQL and checksum-verified migrations; tenant-owned records carry workspace scope and suitable constraints/indexes.
- Adapters: email delivery, one payment gateway, OCR, optional AI, private file storage, XLSX/CSV.
- Processing: bounded worker interface first; durable queue only when retry/durability/concurrency requirements justify it. Jobs must be idempotent and tenant-scoped.
- Operations: structured safe logs, health/readiness, metrics, backups, retention, reconciliation.

## Key domain concepts
User; Workspace; WorkspaceMembership/Role; Session; VerificationToken; PasswordResetToken; Plan; PlanPrice/BillingInterval; Subscription; PaymentEvent/Inbox; Entitlement; UsageLedger/QuotaReservation; Batch; SourceImage; ExtractionSchema; ExtractedRecord; ExtractedField; DuplicateCandidate; Conflict; AuditEvent.

## Subscription and quota invariants
- Version plan/price terms; record applicable terms on each subscription.
- Use explicit UTC billing periods; annual billing does not imply unlimited usage.
- Enforce limits in API/services, not only UI.
- Atomically reserve capacity before expensive work; settle on completion and release/refund reservation on failure according to documented policy.
- Retries and duplicate webhook deliveries must not double-charge or grant access twice.
- A browser return URL is not proof of payment. Only verified, replay-safe server-side gateway events or documented reconciliation can grant paid entitlements.
- Explicitly define cancellation, grace period, past-due, refund, and expiration before live billing.

## Security
Default deny. Resolve user and membership from a verified session on every request. Apply tenant scoping to services, repositories, and relationship lookups; test cross-tenant IDOR reads/writes. Never store raw passwords or plaintext one-time tokens. Keep gateway/email secrets outside Git. Verify webhooks using provider-required raw request bytes. Bound rate, size, concurrency and retries; keep uploads private; sanitize spreadsheet formulas. Platform admin uses least privilege and audited actions. No public exposure or real customer data until tenant isolation passes.

## Proposed stack / decisions pending
React + TypeScript + Vite; Node.js + TypeScript + Express; PostgreSQL. Benchmark PaddleOCR vs Tesseract. Gateway and email provider pending fit/compliance review. Keep private local storage behind an adapter; introduce durable queue only when justified.

## Processing flow
Register/verify → select authorized workspace → resolve plan and reserve quota → upload/store → OCR → quality/schema evaluation → eligible AI fallback within budget → extract/normalize → duplicate/conflict candidates → review/edit → combined export → settle usage and expose audit history.
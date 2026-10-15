# SnapText — Project Charter

## Product and business model
SnapText is a customer-facing SaaS that turns image batches into reviewable structured records and one consolidated XLSX/CSV export. It is not an internal-only tool.

- Customers self-register, verify email, sign in, and use their own workspace without manual approval.
- Monetization: monthly and annual subscriptions with explicit plan-based usage limits. No wallet/credits model in v1.
- Payments: automated gateway integration. Select the provider only after verifying Vietnam merchant eligibility, VND/local methods, recurring billing, webhooks, refunds, sandbox, and fees.
- Entitlements and quotas are enforced by the API, never only by the UI.
- Platform administration uses least-privilege roles and audited privileged actions.

## Core workflow
Upload multiple images → validate and privately store → local OCR first → eligible AI fallback only when quality criteria and budget permit → schema extraction → human review/edit → non-destructive duplicate/conflict review → combined XLSX/CSV export. Track provenance, per-image status, failures, retries, quota usage, and AI cost estimates. Never fabricate missing values.

## MVP acceptance criteria
1. Self-service registration, email verification, login/logout, password reset, and secure sessions.
2. Strict tenant/workspace isolation enforced server-side and tested against cross-tenant access.
3. Monthly/yearly plan catalog with explicit limits; actual prices/quotas require owner approval.
4. Gateway checkout, verified signed webhooks, idempotent payment-event processing, and auditable subscription transitions.
5. Server-side entitlements and atomic quota reservation/settlement to prevent concurrent overuse.
6. Upload at least 20 supported images within plan limits with per-file validation and visible statuses.
7. Configurable extraction schema, field provenance, uncertainty, persistent edits, duplicate/conflict review, and one combined XLSX/CSV export.
8. Bounded retries/concurrency/AI budget, integration tests, measured OCR benchmark, operations guide, and release checklist.

## Non-goals for v1
- Perfect OCR guarantees or destructive automatic deduplication.
- Unbounded AI usage.
- Multiple payment gateways at launch.
- Wallet/credits, marketplace, or enterprise invoicing without a separate decision.
- Production deployment without explicit release approval.

## Working principles
Inspect before changing. Separate confirmed requirements from proposals. Prefer small vertical slices. Use migrations, repository interfaces, and provider adapters. Never claim tests, transactions, or deployment succeeded without evidence. Update project docs and next action after every task.
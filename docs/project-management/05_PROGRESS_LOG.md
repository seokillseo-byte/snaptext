# SnapText — Progress Log

## 2026-10-14 — Foundation, PostgreSQL, and upload workflow
- Initialized repository seokillseo-byte/snaptext on branch foundation/project-bootstrap.
- Added project-management docs, React + TypeScript + Vite UI, Express API, PostgreSQL pool, checksum-verified migration runner, schema and Compose service.
- Added workspace/batch creation, private multi-image upload, server-side image signature validation, SHA-256 duplicate reporting, per-image status, bounded upload limits and private temporary staging/cleanup.
- Added BatchRepository contract and PostgreSQL implementation; service-layer SQL was moved into the repository.
- Added paginated workspace/batch/image list/detail APIs with parent-child scope and storage-key privacy tests.
- CI uses a genuine npm lockfile and npm ci. GitHub Actions run 134 passed migrations twice, API tests, TypeScript checks and production builds: https://github.com/seokillseo-byte/snaptext/actions/runs/38593466073
- No local runtime tests were run in this session.

## 2026-10-14 — Business model clarified and SaaS architecture reset
- Owner confirmed SnapText is a customer-facing SaaS for selling the service, not an internal tool.
- Confirmed self-service registration/use, monthly/yearly subscriptions with plan-defined limits, and automated gateway payment.
- Updated project charter, master plan, architecture, roadmap, backlog, decision log, risk register, quality strategy, and next-action handoff for tenant security, server-side entitlements, webhook safety, and staged delivery.
- Added ADR-001 documenting the identity/session/tenant-isolation direction: docs/project-management/10_ADR_SAAS_IDENTITY.md.
- Created GitHub Issue #2 to track Phase 1 identity and tenant isolation: https://github.com/seokillseo-byte/snaptext/issues/2.
- Updated PR #1 description to reflect SaaS scope and security limitations. PR remains Draft/open; no merge or deployment was performed.
- GitHub Actions run 156 was in progress when last checked: https://github.com/seokillseo-byte/snaptext/actions/runs/38595937562. Do not treat it as passed until the run completes.
- No auth, billing, gateway integration, OCR, or export implementation was added in this planning/architecture slice.
- Next: implement Phase 1 identity and tenant isolation, then require cross-tenant tests to pass before public exposure or billing.

## 2026-10-15 — Phase 1 identity and tenant isolation implementation started
- Added migration 002 for users, workspace memberships, server-side sessions, one-time verification/reset tokens, and authentication audit events.
- Added password hashing with Node.js scrypt, hashed session/token storage, self-service register/verify/login/logout/password-reset endpoints, cookie sessions, same-origin checks, and basic per-IP/per-route in-memory auth throttling.
- Protected workspace/batch/image APIs with authentication and workspace membership checks. Workspace creation now grants the creator OWNER membership; workspace listing is scoped to the authenticated user.
- Added customer login/register/verification UI and authenticated integration-test fixtures; added registration/session/tenant-isolation integration tests.
- Email delivery is deliberately fail-closed and provider-neutral. No real email provider is configured; signup cannot complete until the owner selects/configures one. Subscription/quota/payment work is not part of this phase.
- The first Phase 1 CI run exposed two fixture issues (recursive Supertest wrapper and an invalid expired-session fixture); both were corrected.
- GitHub Actions run 224 passed migration, API tests, typecheck, and build for the backend/auth implementation: https://github.com/seokillseo-byte/snaptext/actions/runs/38723754583.
- GitHub Actions run 225 passed migration, API tests, typecheck, and build including the customer password-reset UI: https://github.com/seokillseo-byte/snaptext/actions/runs/38723891469.
- No local tests were run. No merge or deployment was performed.

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action

## 2026-10-15 — Phase 1 token-expiry hardening and documentation
- Added PostgreSQL-backed integration assertions that expired email-verification tokens and expired password-reset tokens are rejected with the existing generic invalid/expired responses.
- Added assertions that registration does not return the verification token in its API response.
- Updated the Phase 1 backlog and next-action handoff to reflect implemented auth middleware, cookie/origin protections, throttling, token-expiry tests, and the still-unselected email provider.
- Updated README and local development guidance to accurately describe authenticated workspace APIs, the fail-closed email delivery blocker, same-origin reverse-proxy expectations, and the `TRUST_PROXY_HOPS` setting.
- GitHub Actions validation for the expiry-test commit is pending; do not treat the tests as passing until the workflow completes successfully.
- Email provider remains a decision required from the owner. The auth throttle remains in-memory and is not suitable for multi-instance deployment; the security review is not complete.
- PR #1 remains Draft/open. No merge or deployment was performed.

- CI run 248 exposed a fixture issue: the migration requires token expiry to occur after token creation, so expired fixtures must backdate `created_at`. Updated both expired-token inserts to satisfy the database constraint; run 249 for commit 5cbef8406abc1fa1402b0aa7300c29b9fc3d563d is pending.


## 2026-10-15 — Resend transactional email adapter
- Owner approved Resend for verification and password-reset email.
- Implemented `ResendEmailSender` behind the existing `EmailSender` interface using Resend's HTTPS email endpoint and environment-only configuration: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Used the native Node.js fetch API to avoid adding a runtime dependency or modifying the lockfile.
- Adapter maps provider/network/invalid-response failures to a generic error and does not include provider response bodies, API credentials, or raw network error details in thrown messages.
- Added unit tests for endpoint, bearer authorization, message payload, timeout signal, provider failure secrecy, network failure secrecy, and blank configuration rejection. Updated API test script so service-level tests run in CI.
- Updated `.env.example`, README, local development guide, backlog, and next-action handoff. No real API key was added to source control.
- GitHub Actions run 270 passed migrations, API tests (including the new Resend adapter tests), TypeScript checks, and production build for implementation commit `e75ce20d9cf3980c9fac4304ec46f04b6222b597`: https://github.com/seokillseo-byte/snaptext/actions/runs/38725845987. No local test run was performed. Live email delivery still requires the owner to configure secrets in the runtime environment and use a sender address from a verified Resend domain.
- PR #1 remains Draft/open. No merge or deployment was performed.


## 2026-10-15 — Resend live-delivery smoke-test support
- Added `apps/api/src/scripts/resend-smoke-test.ts` and API workspace command `npm --workspace @snaptext/api run email:smoke`.
- The script requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and an explicitly configured `RESEND_TEST_TO_EMAIL`; it sends a harmless email without account tokens, prints no credentials, and returns generic failure guidance.
- Documented the manual smoke-test and controlled signup/verification/password-reset test sequence in development instructions, README, next-action handoff, and backlog.
- No Resend API key or live recipient was added to source control. A real delivery test cannot be performed until the owner configures runtime secrets and chooses a controlled inbox.
- CI validation for the latest smoke-test/docs commits is pending; check the latest run before considering the work fully validated. No local test run was performed.
- PR #1 remains Draft/open; no merge or deployment was performed.


## 2026-10-16 — Auth rate-limiter memory hardening
- Created draft PR #3 from `hardening/auth-rate-limit-memory` targeting `foundation/project-bootstrap`: https://github.com/seokillseo-byte/snaptext/pull/3.
- Extracted the process-local authentication rate limiter into `apps/api/src/middleware/authRateLimit.ts`; preserved the 15-minute window, 10-attempt threshold, and existing 429 response contract.
- Added periodic pruning of expired entries and a hard cap of 10,000 keys with oldest-entry eviction to bound memory growth under high-cardinality IP traffic.
- Added deterministic tests for threshold enforcement, expiry pruning, and maximum map size in `apps/api/src/authRateLimit.test.ts`.
- GitHub Actions run 287 passed the `Install, migrate, test, typecheck, build` job: https://github.com/seokillseo-byte/snaptext/actions/runs/38881211758. The user also confirmed the green CI/PR state with screenshots.
- This remains process-local; it is not suitable as a distributed limiter for multi-instance deployments. No secrets, merge, or deployment were performed. PR #3 remains Draft/open.
- Next: review and test same-origin/CSRF policy and cross-tenant query scoping; keep email live-delivery and shared throttling as release blockers.


## 2026-10-16 — Origin/CSRF guard hardening (CI pending)
- Reviewed `requireSameOrigin` and found state-changing requests with a session cookie were allowed when the Origin header was missing.
- Updated the guard to require Origin for cookie-authenticated state-changing requests, normalize/parse origins with the URL parser, reject malformed or mismatched origins, and retain compatibility for requests without a session cookie. Safe methods remain exempt.
- Added `apps/api/src/authenticationOrigin.test.ts` covering same-origin success, missing Origin with session cookie, hostile origin suffix, malformed origin, GET exemption, and non-cookie API compatibility.
- CI has been triggered by the new commits; do not consider this slice validated until test/typecheck/build complete successfully. No local test run was performed.
- Follow-up remains: audit the entire workspace/batch/image path for tenant scoping and add cross-tenant read/write regression coverage; verify trusted proxy behavior in deployment config. PR #3 remains Draft/open; no merge/deployment.

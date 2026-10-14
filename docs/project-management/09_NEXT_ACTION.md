# SnapText — Next Action

## Current status
SnapText is a customer-facing SaaS: self-service signup, monthly/yearly subscriptions with server-enforced limits, and automated gateway payment. Foundation code includes React + TypeScript + Vite, Express + TypeScript, PostgreSQL migrations, private multi-image upload, and paginated workspace/batch/image APIs. PR #1 remains Draft/open; no merge or deployment without explicit approval.

## Immediate next action — Phase 1: Identity and tenant isolation
1. Inspect current dependencies, API route/service/repository layering, migration conventions, frontend routing, and test fixtures on branch foundation/project-bootstrap.
2. Record an ADR for authentication/session strategy and email verification/password reset.
3. Implement a secure vertical slice: users + workspace memberships/roles + sessions/tokens + auth endpoints + tenant authorization on existing routes.
4. Add migrations only; do not rewrite existing migrations.
5. Test anonymous access, cross-tenant IDOR reads/writes, token expiry/replay, session revocation, and existing workflow regressions.
6. Update docs and run GitHub Actions. Do not begin payment integration until tenant security and plan/quota foundations are in place.

## Decisions deliberately not invented
- Gateway: not selected. Compare Vietnam merchant eligibility, VND/local methods, recurring billing, webhooks, refunds, sandbox and fees; recommend one for owner approval.
- Plan names, prices, image quotas, batch/file/storage limits, trial/grace periods and cancellation/refund policy: require owner approval before publishing offers.
- Email provider: not selected; keep behind an adapter pending deliverability/cost review.

## Safety and release gates
- No public/staging exposure before authentication and tenant-isolation tests pass.
- No paid entitlement from a browser return URL alone.
- No real payment credentials or customer data in GitHub.
- Keep PR #1 Draft/open; no merge or deployment unless explicitly requested.

## Handoff format
Report phase/objective, files changed, migrations, endpoints/UI delivered, tests actually run and exact CI status/links, known gaps, decisions needed, and next single action.
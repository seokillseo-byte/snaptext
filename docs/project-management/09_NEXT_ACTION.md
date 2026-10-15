# SnapText — Next Action

## Current status
SnapText is a customer-facing SaaS: self-service signup, monthly/yearly subscriptions with server-enforced limits, and automated gateway payment. Foundation code includes React + TypeScript + Vite, Express + TypeScript, PostgreSQL migrations, private multi-image upload, and paginated workspace/batch/image APIs. Phase 1 now includes auth migration/API, workspace membership enforcement, customer signup/login/verification/password-reset UI, and authenticated integration tests. GitHub Actions run 225 passed migrations, API tests, typecheck, and build: https://github.com/seokillseo-byte/snaptext/actions/runs/38723891469. Email delivery provider remains unimplemented, so customer registration and password-reset delivery are not operational yet. PR #1 remains Draft/open; no merge or deployment without explicit approval.

## Immediate next action — finish Phase 1 (GitHub Issue #2): Identity and tenant isolation
Issue: https://github.com/seokillseo-byte/snaptext/issues/2

1. Verify the current GitHub Actions run and fix any migration, test, TypeScript, or build failures.
2. Add integration coverage for password-reset expiry and email-verification expiry; review auth audit/error behavior.
3. Choose and implement an email delivery provider behind the existing EmailSender interface; test verification and reset delivery without exposing tokens in logs or API responses.
4. Review the in-memory authentication rate limiter and decide whether to use a shared store before multi-instance deployment.
5. Confirm cookie/CORS/reverse-proxy settings for the actual deployment origin.
6. Re-run CI and complete a security review. Do not begin public exposure, subscriptions, or payment integration until tenant-isolation gates pass.

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
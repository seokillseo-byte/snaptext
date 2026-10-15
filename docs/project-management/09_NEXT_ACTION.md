# SnapText — Next Action

## Current status
SnapText is a customer-facing SaaS: self-service signup, monthly/yearly subscriptions with server-enforced limits, and automated gateway payment. Phase 1 now includes the identity migration/API, workspace membership enforcement, customer signup/login/verification/password-reset UI, hashed single-use tokens, secure session cookies, same-origin checks, auth throttling, and authenticated tenant-isolation integration tests. The latest commit adds explicit integration coverage that expired email-verification and password-reset tokens are rejected; GitHub Actions must pass for that commit before this coverage is considered validated. Email delivery provider remains unselected and unimplemented, so customer registration and password-reset delivery are not operational yet. PR #1 remains Draft/open; no merge or deployment without explicit owner approval.

## Immediate next action — finish Phase 1 (GitHub Issue #2): Identity and tenant isolation

1. Confirm GitHub Actions passes on the latest commit and fix any failures.
2. Owner decision required: choose an email delivery provider. Keep the current fail-closed EmailSender adapter until provider and sender-domain configuration are approved; do not silently pick a vendor or commit credentials.
3. Implement the approved provider adapter using environment-based credentials; verify delivery for email verification and password reset, and ensure tokens never appear in application logs or API responses.
4. Complete the auth security review: token/session lifecycle, audit failures, rate-limit memory growth, multi-instance rate limiting, same-origin/cookie behavior behind the actual reverse proxy, and deployment configuration.
5. Update docs and rerun CI. Do not begin public exposure, subscriptions, or payment integration until the identity and tenant-isolation gates pass.

## Decisions deliberately not invented
- Email delivery provider: not selected; owner approval is required before provider-specific implementation. Keep the `EmailSender` interface provider-neutral.
- Gateway: not selected. Compare Vietnam merchant eligibility, VND/local methods, recurring billing, webhooks, refunds, sandbox and fees; recommend one for owner approval.
- Plan names, prices, image quotas, batch/file/storage limits, trial/grace periods and cancellation/refund policy: require owner approval before publishing offers.

## Safety and release gates
- No public/staging exposure before authentication and tenant-isolation tests pass and security review is complete.
- No paid entitlement from a browser return URL alone.
- No real payment credentials or customer data in GitHub.
- Keep PR #1 Draft/open; no merge or deployment unless explicitly requested.

## Handoff format
Report phase/objective, files changed, migrations, endpoints/UI delivered, tests actually run and exact CI status/links, known gaps, decisions needed, and next single action.

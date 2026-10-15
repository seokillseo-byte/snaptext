# SnapText — Next Action

## Current status
SnapText is a customer-facing SaaS: self-service signup, monthly/yearly subscriptions with server-enforced limits, and automated gateway payment. Phase 1 includes identity/session APIs, workspace membership enforcement, customer auth UI, hashed single-use tokens, and tenant-isolation tests. A provider-neutral `EmailSender` now has a Resend HTTPS API implementation configured through `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. No secret is committed. Adapter tests cover the request payload/auth header, provider failures, network failures, and safe generic errors. The latest GitHub Actions run must pass before considering the changes validated.

## Immediate next action — validate Resend integration and finish Phase 1
1. Confirm GitHub Actions passes for the latest commit; fix failures without weakening CI.
2. In the deployment/runtime environment only, configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; verify the sender domain in Resend. Do not commit API keys or paste secrets into chat.
3. Run a real email smoke test for registration verification and password reset using a controlled test account. Confirm the message arrives, the token is usable only once and before expiry, and no token or credential appears in logs/API responses.
4. Review auth audit failures, token/session lifecycle, process-local rate-limit memory growth, multi-instance rate limiting, and cookie/origin behavior behind the actual reverse proxy.
5. Update progress and CI evidence. Do not expose publicly or start subscription/payment implementation until Phase 1 release gates are met.

## Decisions deliberately not invented
- Email provider: Resend selected and adapter implemented. API key and sender identity are runtime configuration, not source-code values.
- Gateway: not selected. Compare merchant eligibility in Vietnam, VND/local methods, recurring support, signed webhooks, refunds, sandbox and fees; obtain owner approval before provider-specific implementation.
- Plan names, prices, image quotas, batch/file/storage limits, trial/grace periods and cancellation/refund policy require owner approval.

## Safety and release gates
- No public/staging exposure before authentication and tenant-isolation tests pass and security review is complete.
- No paid entitlement from a browser return URL alone.
- No real payment credentials, Resend API keys, or customer data in GitHub.
- Keep PR #1 Draft/open; no merge or deployment unless explicitly requested.

## Handoff format
Report objective, files changed, tests actually run and exact CI status/links, live delivery status, known gaps, decisions needed, and the next single action.

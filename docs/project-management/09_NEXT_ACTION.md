# SnapText — Next Action

## Current status
SnapText is a customer-facing SaaS: self-service signup, monthly/yearly subscriptions with server-enforced limits, and automated gateway payment. Phase 1 includes identity/session APIs, workspace membership enforcement, customer auth UI, hashed single-use tokens, and tenant-isolation tests. A provider-neutral `EmailSender` now has a Resend HTTPS API implementation configured through `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. No secret is committed. Adapter tests cover the request payload/auth header, provider failures, network failures, and safe generic errors. The latest GitHub Actions run must pass before considering the changes validated.

## Immediate next action — validate Resend integration and finish Phase 1
1. Confirm GitHub Actions passes for the latest commit; fix failures without weakening CI. (PR #3 rate-limiter hardening is validated by run 287.)
2. In the API runtime environment only, configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; verify the sender domain in Resend. Do not commit API keys or paste secrets into chat.
3. Set `RESEND_TEST_TO_EMAIL` to a controlled inbox and run `npm --workspace @snaptext/api run email:smoke` from the repository root. Confirm the message arrives and review Resend delivery logs.
4. Run controlled end-to-end signup/verification and password-reset tests. Confirm each token works once and before expiry, and no token or credential appears in logs/API responses.
5. Review auth audit failures, token/session lifecycle, and cookie/origin behavior behind the actual reverse proxy. The process-local limiter now prunes expired entries and caps memory, but multi-instance rate limiting still needs shared storage.
6. Update progress and CI evidence. Do not expose publicly or start subscription/payment implementation until Phase 1 release gates are met.

## Next code-review slice — CSRF/origin and tenant isolation
1. Inspect how Express derives protocol/host behind the configured trusted proxy and how the frontend calls state-changing endpoints.
2. Implemented a focused policy: state-changing requests carrying the `snaptext_session` cookie require a valid matching Origin; malformed/mismatched Origin is rejected; safe methods are exempt; no-cookie API clients may omit Origin. Validate this behavior in CI and against actual proxy/frontend behavior.
3. Audit workspace/batch/image read and write queries for workspace scoping, and add regression tests for cross-tenant access.
4. Keep this in a separate draft PR; no merge or deployment until tests and security review pass.

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

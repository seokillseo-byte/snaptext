# Phase 1 security audit — initial code review

- Review date: 2026-10-17
- Reviewed ref: `hardening/auth-rate-limit-memory`
- Scope: authentication routes, session middleware, identity ADR, root scripts, and the PR/CI metadata available during this review.
- This is a focused source review, not a penetration test or deployment approval.

## Findings and follow-up

### SEC-01 — Authentication last-seen write is fire-and-forget

In `apps/api/src/middleware/authentication.ts`, updating `auth_sessions.last_seen_at` is intentionally not awaited and errors are swallowed. This avoids blocking requests, but makes session activity/audit behavior difficult to observe. Decide whether last-seen is operational metadata or a security/audit requirement. If it is security-relevant, use controlled error handling/metrics and tests; do not log session secrets.

### SEC-02 — Same-origin validation depends on proxy/origin configuration

`requireSameOrigin` compares the supplied Origin with an origin assembled from `request.protocol` and `Host`. Behind a reverse proxy, forwarded protocol/host trust must be configured narrowly and documented. Verify deployment proxy settings and add tests for spoofed Host/forwarded headers before production exposure. Do not enable blanket trust-proxy settings.

### SEC-03 — Authentication rate limiting is process-local

The limiter bounds memory by sweeping expired entries and capping map size, but state is not shared across API instances and evicting entries can allow renewed attempts. This is acceptable only as a temporary low-volume safeguard. Before multi-instance production, replace or supplement it with a shared store and test distributed behavior.

### SEC-04 — Session lifecycle needs explicit regression coverage

The source review confirms opaque cookie sessions are looked up by token hash, with revoked/expired sessions rejected and unverified users denied. Confirm tests cover login rotation, logout revocation, password-reset revocation of existing sessions, expiry, token replay, and cookie clearing on error paths. Do not infer coverage solely from the implementation.

### SEC-05 — Live email delivery remains an external release gate

Source documentation describes a Resend adapter, but repository inspection alone cannot prove a real message is delivered or that the sender domain is verified. Perform a controlled smoke test using owner-managed runtime secrets and a test mailbox. Never put secrets or reset/verification tokens in commits, issue comments, or chat.

## Verified repository state

- PR #1 foundation CI run #286 for commit `a8e1794000fa1215e37f3c636c99dc549696f868` reported success.
- PR #3 rate-limit hardening CI run #303 for commit `78fc7268faeb84b7316e9074b9651843159c390e` reported success.
- PR #3 compares as 24 commits ahead of and 0 behind `foundation/project-bootstrap` at the inspected refs.
- Those successful runs do not prove the current review branch or this documentation-only change passes CI.

## Release gates

- [ ] Re-run CI on the current PR heads and this branch.
- [ ] Confirm workspace/batch/image cross-tenant read and write tests cover all routes.
- [ ] Confirm token expiry/replay and session revocation tests.
- [ ] Verify origin/cookie behavior under the intended reverse-proxy topology.
- [ ] Replace process-local throttling before multi-instance deployment.
- [ ] Verify live email delivery and sender domain in a controlled environment.
- [ ] No public deployment until the owner explicitly approves after all release gates pass.

## Scope boundary

This audit does not authorize merging, deployment, billing, or handling real customer images. OCR implementation should use synthetic or properly licensed fixtures and preserve uncertainty and provenance.

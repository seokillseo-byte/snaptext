# SnapText — Risk Register

| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| No authentication/tenant authorization | Cross-customer data exposure | Block public/staging exposure; test IDOR across every resource family | Critical / open |
| Weak account/session/token implementation | Account takeover | Maintained libraries, hashed one-time tokens, expiry/replay defense, rotation/revocation, rate limits | Open |
| Gateway unsupported for merchant/recurring VND billing | Rework or unusable checkout | Verify eligibility, methods, recurring support, fees, refunds and sandbox before selection | Open |
| Forged/replayed payment webhook | Unauthorized paid access or duplicate state changes | Signature verification, durable inbox, idempotency, replay-safe transitions and reconciliation | Open |
| Quota race/concurrent requests | Unpaid usage or unfair blocking | Atomic reservation/settlement and concurrency tests | Open |
| Invented prices/limits | Wrong unit economics | Keep configurable; owner approval before customer-facing publication | Open |
| OCR varies by image/layout/language | Incorrect records | Representative benchmark, uncertainty, human review | Open |
| AI fallback cost grows unexpectedly | Cost overrun | Budgets, bounded retries, usage logs, mocked CI | Open |
| Duplicate matching merges unrelated records | Data loss | Candidate-only matching and explicit review | Open |
| Uploads expose private data or enable abuse | Security incident | Private storage, file validation, tenant authorization and resource limits | Open |
| Large batches exhaust resources | Outage/slow processing | Streaming, bounded concurrency, queue if needed | Open |
| Spreadsheet formula injection | Unsafe export | Sanitize dangerous leading characters and test | Open |
| Provider outage blocks a batch | Partial failure | Timeouts, isolated statuses, bounded retry | Open |
| CI mistaken for production proof | False confidence | Separate unit, integration, staging, and release evidence | Open |
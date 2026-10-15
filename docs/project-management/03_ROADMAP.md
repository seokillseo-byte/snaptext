# SnapText — Roadmap

| Phase | Outcome | Status |
|---|---|---|
| 0. Foundation | React/API/PostgreSQL, migrations, CI, workspace/batch/image upload and read APIs | Implemented on Draft PR; CI evidence recorded |
| 1. Identity + tenant security | Self-service auth, memberships, secure sessions, tenant authorization | Next — P0 |
| 2. Plans + quotas | Monthly/yearly plans, entitlements, usage ledger, atomic limits | Planned — P0 |
| 3. Automated payments | One selected gateway, hosted checkout, verified/idempotent webhooks | Planned — P0 |
| 4. Customer SaaS dashboard | Onboarding, plan/usage, account/subscription management | Planned |
| 5. OCR + extraction | Benchmark local OCR; schema-driven extraction | Planned |
| 6. AI fallback | Measured thresholds, provider adapter, budget controls | Planned |
| 7. Review + matching | Editable records, provenance, duplicate/conflict review | Planned |
| 8. Combined exports | Safe consolidated CSV/XLSX per batch | Planned |
| 9. Release readiness | E2E, monitoring, backups, staging and release checklist | Planned |

## Gates
- No public/staging exposure before auth and tenant-isolation tests pass.
- No gateway choice or recurring-billing assumptions without a recorded provider decision.
- No paid entitlement from a client redirect; only verified server-side payment evidence.
- No merge or deployment without explicit owner approval.
- Phase status changes only with implementation/test evidence in the progress log.
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

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action
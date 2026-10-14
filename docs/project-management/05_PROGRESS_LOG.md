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
- Gateway, email provider, plan prices/limits, grace period, and cancellation/refund policy remain undecided pending evidence and owner approval.
- PR #1 remains Draft/open. No merge, public exposure, or deployment was performed.
- Next: implement Phase 1 identity and tenant isolation after inspecting the current code and dependencies; test cross-tenant access comprehensively.

## Entry format for each task
- Scope and outcome
- Files changed
- Commands/tests actually run and exact result
- Known gaps or blockers
- Decisions made
- Next action
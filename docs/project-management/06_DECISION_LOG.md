# SnapText — Decision Log

## Confirmed product/business decisions
- D-001: Customer-facing web SaaS hosted on a self-managed VPS; not an internal-only utility.
- D-002: PostgreSQL persistence.
- D-003: Local OCR first; AI/API fallback only when quality criteria fail and budget allows.
- D-004: Multiple images per batch.
- D-005: One combined XLSX/CSV dataset per batch.
- D-006: Customers review and edit extracted values.
- D-007: Duplicate/conflict detection is non-destructive; ambiguous records are not auto-merged.
- D-008: Preserve source image and field-level provenance where feasible.
- D-009: Track AI provider/model/estimated cost; cap retries and stop fallback when budget is exhausted.
- D-010: Never fabricate missing values.
- D-011: Self-service registration; no manual approval gate for ordinary customers.
- D-012: Monthly/yearly subscriptions with plan-defined limits; no wallet/credits in v1.
- D-013: Automated payment gateway is required; provider not selected until fit/compliance review and owner approval.
- D-014: Tenant authorization is a release gate; workspace IDs from clients are not authorization.
- D-015: Keep PR #1 Draft/open; do not merge or deploy without explicit owner instruction.

## Technical proposals pending evidence/approval
- P-001: React + TypeScript + Vite frontend.
- P-002: Node.js + TypeScript + Express API.
- P-003: Benchmark PaddleOCR and Tesseract before choosing an OCR engine.
- P-004: Bounded worker abstraction first; durable queue when requirements justify it.
- P-005: Private local/VPS storage behind an adapter initially.
- P-006: Select auth/session and email providers after inspecting dependencies, security needs and operating constraints.
- P-007: Select one gateway after checking Vietnam merchant eligibility, VND/local methods, recurring billing, signed webhooks, refunds, sandbox and fees.
- P-008: Plan names, prices, quotas, trial/grace periods, cancellation/refund policy require owner approval; do not invent these commercial values.

A proposal becomes accepted only after trade-offs are documented and the owner confirms it, or evidence makes the choice low-risk and reversible.
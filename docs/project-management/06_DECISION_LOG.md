# SnapText — Decision Log

## Confirmed product decisions
- D-001: Web application hosted on a self-managed VPS.
- D-002: PostgreSQL persistence.
- D-003: Local OCR first; AI/API fallback only when quality criteria fail and budget allows.
- D-004: Multiple images per batch.
- D-005: One combined XLSX/CSV dataset per batch.
- D-006: Users review and edit extracted values.
- D-007: Duplicate/conflict detection is non-destructive; ambiguous records are not auto-merged.
- D-008: Preserve source image and field-level provenance where feasible.
- D-009: Track AI provider/model/estimated cost; cap retries and stop fallback when budget is exhausted.
- D-010: Never fabricate missing values.

## Proposed technical decisions — pending validation
- P-001: React + TypeScript + Vite frontend.
- P-002: Node.js + TypeScript + Express API.
- P-003: Benchmark PaddleOCR and Tesseract before choosing an engine.
- P-004: Defer Redis/BullMQ until workload justifies it.
- P-005: Private local/VPS storage behind an adapter initially.
- P-006: Select database access and migration libraries alongside persistence implementation.

A proposal becomes accepted only after trade-offs are documented and the project owner confirms it, or evidence makes the choice low-risk and reversible.

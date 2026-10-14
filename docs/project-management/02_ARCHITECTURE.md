# SnapText — Architecture

## Principles
- Web UI communicates with a versioned API.
- Routes validate transport concerns and delegate business rules to services.
- Services depend on repository/provider interfaces; repositories own persistence.
- OCR, AI, file storage, and exports use adapters.
- Long-running work is asynchronous when justified and always concurrency-bounded.
- Each image is independently trackable, retryable, and traceable.
- Uncertain records are never silently merged.

## Proposed initial stack — pending validation
- Frontend: React, TypeScript, Vite.
- API: Node.js, TypeScript, Express.
- Database: PostgreSQL with explicit migrations.
- OCR candidates: benchmark PaddleOCR against Tesseract on representative images.
- Queue: defer Redis/BullMQ until workload justifies it.
- Storage: private local/VPS storage behind an adapter.
- AI: provider adapter with mocked tests and explicit budget controls.
- Export: server-generated CSV and XLSX.

## Conceptual entities
Batch; SourceImage; versioned ExtractionSchema; ExtractedRecord; ExtractedField; DuplicateCandidate; Conflict; UsageEvent.

## Processing flow
Upload → validate/store → local OCR → quality/schema evaluation → eligible AI fallback if budget permits → extraction → normalization → duplicate/conflict candidates → human review/edit → combined export.

## Quality and uncertainty
Keep raw OCR separate from normalized values. Missing values remain missing. Use provider confidence only when supplied, or a documented deterministic heuristic. Link values to source images and OCR spans/coordinates where available. Preserve conflicting candidates for review.

## Security
Validate actual file type and size; generate storage names server-side; prevent path traversal; keep uploads private; enforce ownership/access controls; keep secrets in environment variables; bound rate, size, concurrency, and retries; sanitize spreadsheet formulas; never log secrets or image contents.

# SnapText — Project Charter

## Purpose
Build a web application that converts batches of images into reviewable structured records and exports one consolidated XLSX/CSV dataset.

## Confirmed requirements
- Web application hosted on a self-managed VPS; PostgreSQL persistence.
- Multiple image uploads and batch processing.
- Local OCR first; AI/API fallback only when quality criteria require it and budget permits.
- One combined XLSX/CSV export per batch, not one file per image.
- Users can review and edit extracted values.
- Flag possible duplicates and conflicts; do not automatically delete or merge ambiguous records.
- Preserve source image and field-level provenance where feasible.
- Track batch/image status, failures, retries, and AI usage/cost estimates.
- Never fabricate missing values.

## MVP acceptance criteria
1. Upload at least 20 supported images with per-file validation and visible statuses.
2. Apply a configurable extraction schema.
3. Preserve source references and provenance for extracted fields.
4. Flag missing/low-confidence values for review.
5. Detect likely duplicates and conflicts non-destructively.
6. Persist edits.
7. Export one valid combined XLSX or CSV.
8. Isolate per-image failures and bound retries.
9. Enforce configurable AI budget and log usage estimates.
10. Provide automated tests, benchmark methodology, and deployment guide.

## Non-goals
- Guaranteed perfect OCR.
- Unreviewed destructive deduplication.
- Unbounded AI API usage.
- Production deployment without explicit release approval.
- Billing, teams, and marketplace features before the core workflow is proven.

## Working principles
Inspect before changing. Distinguish requirements from proposals. Prefer end-to-end vertical slices. Never claim tests or deployment succeeded without evidence. Update project-management documents and the next action after each task.

# SnapText

SnapText is a web application being built to turn batches of images into one structured dataset, with source traceability, human review, duplicate/conflict handling, and consolidated CSV/XLSX export.

## Current implementation

Implemented and validated in GitHub Actions:
- React + TypeScript + Vite web interface.
- Express + TypeScript API with liveness and PostgreSQL readiness checks.
- PostgreSQL schema and checksum-verified SQL migrations.
- Workspace and batch creation.
- Multi-image upload with server-side file signature validation for PNG, JPEG, WEBP, GIF, TIFF, and BMP.
- SHA-256 content hashing and duplicate-image reporting within a batch.
- Private local image storage and private temporary disk staging for multipart uploads.
- Configurable file count, per-file size, and combined request-size limits.
- Integration tests for valid image upload, fake image rejection, duplicate detection, request-size rejection, and temporary-file cleanup.

Customer authentication screens and API are implemented on the current Draft PR: registration, email verification, login/logout, password reset, server-side sessions, and workspace membership enforcement. Session and one-time tokens are stored as hashes; expired and replayed tokens are rejected. Email delivery now has a Resend HTTPS API adapter for verification and password-reset messages. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the API environment and verify the sender domain in Resend before live use; without both values, delivery remains fail-closed. Adapter tests cover request shape, provider/network failures, and secret-safe error handling. A manual live-delivery smoke-test command is available: set `RESEND_TEST_TO_EMAIL` to a controlled inbox and run `npm --workspace @snaptext/api run email:smoke`; this sends a harmless message and never prints credentials. GitHub Actions must pass before the latest changes are considered validated. OCR and extraction have not been implemented yet.

### Latest branch additions — validated in GitHub Actions run 134
- Paginated workspace, batch, and image list endpoints with total-count metadata.
- Workspace, batch, and image detail endpoints scoped to their parent resources.
- PostgreSQL integration tests for pagination, parent scoping, not-found responses, and keeping storage keys private in API responses.

## Planned product workflow

1. Upload a batch of images.
2. Run local OCR first.
3. Validate OCR quality and extract fields using a configurable schema.
4. Use an AI provider only when fallback criteria are met and the configured budget allows it.
5. Normalize records and flag possible duplicates or conflicting values for review.
6. Let users inspect and edit extracted data while preserving source provenance.
7. Export the reviewed batch as one combined XLSX or CSV file.

## Technology direction

The initial stack is React + TypeScript + Vite, Node.js + TypeScript, Express, and PostgreSQL. PaddleOCR and Tesseract remain candidates; the OCR engine must be selected using representative Vietnamese and English benchmark images. See `docs/project-management/06_DECISION_LOG.md` for confirmed decisions and proposals.

## Development

See [Local development guide](docs/DEVELOPMENT.md).

## Project management

Project charter, master plan, architecture, roadmap, backlog, progress, decisions, risks, quality strategy, and next action live in `docs/project-management/`.

## Security and limitations

- Authentication and workspace membership enforcement are implemented on the current branch, but a full security review and passing CI on the latest commit are required before public exposure. Auth throttling is in-memory and must be replaced with shared storage before multi-instance deployment. Live Resend delivery is not yet confirmed: set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` outside source control, verify the sender domain, and run the documented smoke test plus controlled signup/reset tests.
- Subscription plans, quota enforcement, and payment gateway integration are not implemented. Do not expose this development preview publicly or upload sensitive/production data.
- Keep `STORAGE_ROOT` and `UPLOAD_TEMP_ROOT` outside any public web root.
- Never commit API keys, passwords, production data, or private images.
- Use synthetic or properly licensed sample images in automated tests.
- AI fallback remains disabled; OCR, schema-driven extraction, review/edit, record-level duplicate/conflict resolution, and consolidated CSV/XLSX export are not implemented.
- `package-lock.json` is committed and CI uses `npm ci` for reproducible dependency installation.

# Local development

## Prerequisites
- Node.js 22 or another supported Node.js 20+ release.
- npm.
- Docker Compose or a PostgreSQL 16 instance.

## Setup
1. Copy .env.example to .env and adjust values for your local environment.
2. Start PostgreSQL with docker compose up -d postgres, or configure DATABASE_URL for an existing instance.
3. Install dependencies with npm install.
4. Apply schema migrations with npm run db:migrate.
5. Run the API and web app with npm run dev.
6. Open the Vite URL shown in the terminal (normally http://localhost:5173).
7. Check API liveness at http://localhost:3001/api/health and database readiness at http://localhost:3001/api/health/ready.

## Initial API flow
Create a workspace:
```bash
curl -X POST http://localhost:3001/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"My workspace"}'
```

Use the returned workspace ID to create a batch:
```bash
curl -X POST http://localhost:3001/api/workspaces/WORKSPACE_ID/batches \
  -H "Content-Type: application/json" \
  -d '{"name":"October import"}'
```

Upload one or more image files to the returned batch ID. The multipart field name is `images`:
```bash
curl -X POST http://localhost:3001/api/workspaces/WORKSPACE_ID/batches/BATCH_ID/images \
  -F "images=@./sample.png" \
  -F "images=@./sample-2.jpg"
```

The upload endpoint verifies file signatures rather than trusting the supplied filename or browser MIME type. It accepts PNG, JPEG, WEBP, GIF, TIFF, and BMP. Defaults are up to 20 files per request, 10 MB per file, and 100 MB combined request size; these can be configured using `UPLOAD_MAX_FILES`, `UPLOAD_MAX_FILE_SIZE_MB`, and `UPLOAD_MAX_TOTAL_SIZE_MB`. Multipart data is staged in private temporary disk storage (`UPLOAD_TEMP_ROOT`) and then moved to private permanent local storage (`STORAGE_ROOT`) using server-generated filenames. Keep both paths outside any public web root. Exact-content duplicates within one batch and unsupported files are returned in the `rejected` array rather than silently merged.

## Checks
- `npm test` — API unit and integration tests.
- `npm run typecheck` — TypeScript checks.
- `npm run build` — production builds.
- `npm run db:migrate` — apply pending SQL migrations; applied migration checksums are verified.

## Current limitations
There is not yet user authentication or workspace authorization; do not expose this preview publicly or upload sensitive/production data. OCR, AI fallback, schema-driven extraction, review/edit, duplicate-record comparison, conflict resolution, and combined CSV/XLSX export are not implemented. Use synthetic/test images during development.

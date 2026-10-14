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

The upload endpoint verifies file signatures rather than trusting the supplied filename or browser MIME type. It accepts PNG, JPEG, WEBP, GIF, TIFF, and BMP up to the configured per-file size and batch file-count limits. Files are written to private local storage using server-generated names; paths are not exposed by the API. Exact-content duplicates within one batch and unsupported files are returned in the `rejected` array, without silently merging records. Configure `STORAGE_ROOT` outside a public web root for deployment.

## Checks
- `npm test` — API unit and integration tests.
- `npm run typecheck` — TypeScript checks.
- `npm run build` — production builds.
- `npm run db:migrate` — apply pending SQL migrations; applied migration checksums are verified.

## Current limitations
OCR, AI fallback, schema-driven extraction, review/edit, duplicate-record comparison, conflict resolution, and combined CSV/XLSX export are not implemented yet. There is not yet user authentication or workspace authorization; treat this as a development preview only and do not expose it publicly or upload sensitive/production data. The upload UI remains disabled until the API and storage behavior have passed CI and the UI is wired to the endpoints.

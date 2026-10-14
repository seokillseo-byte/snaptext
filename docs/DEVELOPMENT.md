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

## Checks
- npm test — API tests.
- npm run typecheck — TypeScript checks.
- npm run build — production builds.
- npm run db:migrate — apply pending SQL migrations; applied migration checksums are verified.

## Current limitations
The upload control is intentionally disabled. The initial PostgreSQL schema exists, but upload validation, private storage, OCR, AI fallback, review, duplicate/conflict resolution, and export are not implemented yet. Do not use this preview for production data.

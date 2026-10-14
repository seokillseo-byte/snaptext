# Local development

## Prerequisites
- Node.js 22 or another supported Node.js 20+ release.
- npm.
- PostgreSQL will be required when persistence is implemented; the current foundation health endpoint does not connect to a database yet.

## Setup
1. Copy .env.example to .env and adjust values for your local environment.
2. Install dependencies with npm install.
3. Run the API and web app with npm run dev.
4. Open the Vite URL shown in the terminal (normally http://localhost:5173).
5. Check API health at http://localhost:3001/api/health.

## Checks
- npm test — API tests.
- npm run typecheck — TypeScript checks.
- npm run build — production builds.

## Current limitations
The upload control is intentionally disabled. Upload validation, private storage, OCR, database persistence, AI fallback, review, and export have not yet been implemented. Do not use this foundation preview for production data.

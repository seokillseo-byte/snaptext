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

## Authentication and API access

Workspace, batch, and image endpoints require a verified account and a valid session cookie. Registration and password reset send one-time emails through the `EmailSender` interface. No delivery provider is selected or configured in this repository, so signup is expected to fail closed until the owner approves a provider and the deployment configures its credentials. Do not bypass this gate or place provider secrets in source control.

The web development server proxies `/api` to the API, preserving same-origin browser requests. For a deployment, serve the web app and API under the same origin through a trusted reverse proxy where possible. Set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops only when deployed behind a proxy; do not set it blindly. The session cookie is HttpOnly and SameSite=Lax, and is marked Secure when `NODE_ENV=production`.

After a real email sender is configured, the expected flow is:
1. Register an account in the web UI.
2. Open the verification email and enter the one-time verification token.
3. Sign in; the API sets the session cookie.
4. Create a workspace and batches through the authenticated UI/API.
5. Use password reset only through the one-time email token flow.

The API returns generic password-reset request responses to reduce account enumeration. Verification and reset tokens are single-use and expire. Never log or share tokens, cookies, or customer data.

## Checks
- `npm test` — API unit and integration tests.
- `npm run typecheck` — TypeScript checks.
- `npm run build` — production builds.
- `npm run db:migrate` — apply pending SQL migrations; applied migration checksums are verified.

## Current limitations
Authentication and workspace authorization are implemented but Phase 1 is not release-ready: the email provider is unselected, auth throttling is process-local, and security review/CI validation for the latest expiry tests must be completed. Do not expose this preview publicly or upload sensitive/production data. OCR, AI fallback, schema-driven extraction, review/edit, duplicate-record comparison, conflict resolution, and combined CSV/XLSX export are not implemented. Use synthetic/test images during development.

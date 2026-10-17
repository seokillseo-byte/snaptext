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
7. Open `http://localhost:5173/demo` to view the interactive UI preview. It uses illustrative sample rows only: it does not run OCR, send API requests, or upload selected files. This is a local development route, not a public hosted demo.
8. Check API liveness at http://localhost:3001/api/health and database readiness at http://localhost:3001/api/health/ready.

## Authentication and API access

Workspace, batch, and image endpoints require a verified account and a valid session cookie. Registration and password reset send one-time emails through the `EmailSender` interface backed by the Resend HTTPS API. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the API process environment. If either value is missing, delivery deliberately fails closed. Use a sender address on a domain verified in Resend; never place a real API key in source control.

The web development server proxies `/api` to the API, preserving same-origin browser requests. For a deployment, serve the web app and API under the same origin through a trusted reverse proxy where possible. Set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops only when deployed behind a proxy; do not set it blindly. The session cookie is HttpOnly and SameSite=Lax, and is marked Secure when `NODE_ENV=production`.

After Resend credentials and a verified sender address are configured, run a real provider connectivity check by setting `RESEND_TEST_TO_EMAIL` to a controlled inbox and running `npm --workspace @snaptext/api run email:smoke` from the repository root. The script sends a harmless message without verification/reset tokens, never prints credentials, and does not prove the full authentication flow. Then perform the full end-to-end checks below using a controlled test account:

After Resend credentials and a verified sender address are configured, the expected flow is:
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
Authentication and workspace authorization are implemented but Phase 1 is not release-ready until CI passes, Resend credentials and a verified sender address are configured and live delivery is verified. Auth throttling is process-local and security review is still required. Do not expose this preview publicly or upload sensitive/production data. OCR, AI fallback, schema-driven extraction, review/edit, duplicate-record comparison, conflict resolution, and combined CSV/XLSX export are not implemented. Use synthetic/test images during development.

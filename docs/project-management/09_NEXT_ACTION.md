# SnapText — Next Action

## Current status
Foundation and PostgreSQL migration have passed a GitHub Actions run. Workspace creation, batch creation, multi-image upload, signature detection, SHA-256 duplicate detection, private local storage, upload integration coverage, and a connected web form have been added on foundation/project-bootstrap. CI for the latest upload/UI changes is still pending verification.

## Immediate next action
1. Inspect the newest GitHub Actions run and fix any install, integration-test, typecheck, or build failures.
2. Confirm the upload UI correctly displays accepted files and rejected files, including batches where every file is rejected.
3. Add a total request-size limit or switch multipart parsing to private temporary disk storage to avoid large in-memory upload requests.
4. Add a lockfile and use npm ci in CI.
5. Extract SQL operations into repository interfaces/implementations and add persistence tests.

## Definition of done
- Latest CI run completes successfully, including migration, API tests, typecheck, and frontend/backend builds.
- Valid images persist with generated private storage keys and SHA-256.
- Unsupported file contents and exact duplicates are reported per file.
- Batch counters match persisted image rows.
- UI displays both accepted and rejected outcomes without losing error details.
- Private storage is ignored by Git and never exposed as a static directory.
- Limitations are documented; no production deployment is claimed.

## After this checkpoint
Add workspace/batch/image list/detail endpoints and persistence repository tests, then implement the first local OCR benchmark. Keep OCR and AI fallback disabled until the benchmark and cost controls are in place.

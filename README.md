# SnapText

SnapText is a web application for extracting structured records from multiple images, reviewing the results, resolving duplicates and conflicts, and exporting one consolidated dataset.

## Product workflow

1. Upload a batch of images.
2. Run local OCR first.
3. Validate OCR quality and extract fields using a configurable schema.
4. Use an AI provider only when fallback criteria are met and the configured budget allows it.
5. Normalize records and flag possible duplicates or conflicting values for review.
6. Let users inspect and edit extracted data while preserving source provenance.
7. Export the reviewed batch as one combined XLSX or CSV file.

## Project status

The repository is being initialized. Technology choices that have not been validated are tracked as proposals in `docs/project-management/06_DECISION_LOG.md`. Do not interpret a planned feature as implemented or tested until the relevant code and test evidence exist.

## Development

The planned initial stack is React + TypeScript + Vite for the frontend, Node.js + TypeScript for the API, PostgreSQL for persistent data, and a local OCR engine selected through a benchmark. These are proposals until confirmed in the decision log.

## Documentation

Project charter, architecture, roadmap, backlog, progress, decisions, risks, quality strategy, and next action live in `docs/project-management/`.

## Security

- Never commit API keys, passwords, production data, or private images.
- Use synthetic or properly licensed sample images in automated tests.
- Keep AI fallback disabled or mocked in CI unless explicitly configured with a safe test provider.
- Do not silently discard uncertain or conflicting extracted records.

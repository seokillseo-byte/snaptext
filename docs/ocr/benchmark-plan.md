# Local OCR benchmark plan

## Purpose

Choose SnapText's default local OCR engine from repeatable measurements for the image-to-structured-data workflow. This plan does not assume either PaddleOCR or Tesseract is better before running the benchmark.

## Dataset rules

- Use only synthetic images or images whose license explicitly permits testing and redistribution.
- Never add customer documents, personal data, API keys, or production exports.
- Include Vietnamese with diacritics and English; mix clean scans, phone photos, rotation, blur, low contrast, varied fonts, and multi-line layouts.
- Keep a manifest mapping each fixture to a stable ID, language, scenario tags, and ground-truth UTF-8 text/fields.
- Do not use filenames containing real names, email addresses, phone numbers, or other personal data.

## Metrics

For every engine/version/configuration, record CER, WER, field-level exact-match accuracy, median/p95 processing latency per image, throughput, failure rate, runtime environment, model requirements, and approximate resource use. Normalize Unicode consistently for scoring, but retain original OCR output. Report results by language and scenario as well as aggregate.

## Reproducibility

- Pin engine/package versions and document OS, runtime, CPU/GPU, and model configuration.
- Run both engines on the exact same fixture set and preprocessing policy.
- Keep raw predictions and machine-readable score summaries as generated artifacts; avoid committing bulky model weights.
- Perform one warm-up per fixture, then at least three timed passes. Report median and p95 latency.
- Inspect representative errors manually and note whether errors change extracted field meaning.
- A benchmark result is invalid if either engine silently skips failed fixtures; failures must be counted.

## Current fixture pack and status

Ten deterministic synthetic SVG fixtures live under `scripts/ocr-benchmark/fixtures/`, with ground truth and regex field rules in `scripts/ocr-benchmark/manifest.example.json`. Scenarios include Vietnamese and English, low contrast, rotation, serif/mixed fonts, blur, small text, multi-line layout, and perspective-like distortion. The pinned rasterizer produces PNGs and source/output SHA-256 provenance. CI uploads generated images and manifests as a short-lived artifact.

The engine adapters support Tesseract TSV and an optional PaddleOCR Python bridge. Ordinary CI uses deterministic fakes rather than downloading large models. The repeated-run harness excludes a per-fixture warm-up, runs configurable measured passes (default three), saves scorer-compatible predictions plus a separate raw per-pass log, and reports median/p95 latency and failures. The regex field extractor is a baseline only; inspect field errors rather than treating it as production-grade extraction.

## Decision rule

Select the default only after results are available. Weight field-level correctness and uncertainty visibility above raw speed alone. Keep the OCR engine behind a provider-neutral adapter so the implementation can change without changing the web API.

## Next steps

1. Run both real engines in documented, pinned environments on the same rasterized fixtures; preserve model/configuration versions.
2. Compare CER/WER, field exact-match accuracy, median/p95 latency, and failure rate by language/scenario.
3. Expand the smoke-test pack with licensed real-world-like layouts (synthetic or redistributable), then manually inspect extraction errors.
4. Review evidence before selecting a default engine. Keep model downloads and hardware-dependent runs out of ordinary CI.

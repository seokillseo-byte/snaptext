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

For every engine/version/configuration, record:

1. Character error rate (CER) = character edit distance / ground-truth character count.
2. Word error rate (WER) = word edit distance / ground-truth word count.
3. Field-level exact-match accuracy for fields extracted from the OCR output.
4. Median and p95 processing latency per image, plus throughput.
5. Failure rate, runtime environment, model download requirements, and approximate resource use.

Normalize Unicode consistently for scoring (document the chosen normalization), but retain original OCR output for inspection. Report results separately by language and scenario, not only as one aggregate.

## Reproducibility

- Pin engine/package versions and document OS, runtime, CPU/GPU, and model configuration.
- Run both engines on the exact same fixture set and preprocessing policy.
- Keep raw predictions and a machine-readable score summary as generated artifacts; avoid committing bulky model weights.
- Run at least three timed passes after warm-up. Report median and p95 rather than a single timing.
- Inspect representative errors manually and note whether errors change extracted field meaning.
- A benchmark result is invalid if either engine silently skips failed fixtures; failures must be counted.

## Decision rule

Select the default only after results are available. Weight field-level correctness and uncertainty visibility above raw speed alone. Document trade-offs and keep the OCR engine behind a provider-neutral adapter so the implementation can change without changing the web API.

## Current fixture pack and status

A deterministic smoke-test pack now lives under `scripts/ocr-benchmark/fixtures/` with ten synthetic SVG source images covering Vietnamese clean text, low contrast, rotated text, serif font; and English clean invoice-like text, multi-line text, blur, and small text. Ground truth and field labels are recorded in `scripts/ocr-benchmark/manifest.example.json`. CI validates fixture IDs, metadata, safe relative paths, and file existence.

These are SVG source fixtures. The pinned rasterizer in `scripts/ocr-benchmark/rasterize.py` converts them to lossless PNGs and emits source/output SHA-256 hashes plus tool versions in a generated provenance manifest. CI uploads the generated PNGs and manifest as a short-lived artifact. The scorer reports aggregate and per-language/per-scenario summaries and rejects duplicate prediction IDs. The separate engine adapters can invoke Tesseract TSV and an optional PaddleOCR Python bridge; CI tests parsing and failure handling with fakes, not real engine inference. This eight-case pack is a smoke-test starter, not enough to select a production default. Expand it with varied fonts, rotations, blur, phone-photo perspective, and multiple layouts before drawing conclusions.

## Next implementation steps

1. Continue expanding beyond ten synthetic cases, especially realistic phone photos, varied layouts, and overlapping/occluded text.
2. Run both real engines in documented, pinned local/benchmark environments on the exact same rasterized fixtures; include warm-up plus at least three timed passes.
3. Preserve raw predictions and all per-fixture failures; run field extraction as a separate stage and inspect its errors.
4. Compare CER/WER, field accuracy, median/p95 latency, and failure rate by language/scenario.
5. Review results before selecting a default engine. Keep model downloads and hardware-dependent runs out of ordinary CI; CI should test adapters with deterministic mocks.

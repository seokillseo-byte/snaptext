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

## Next implementation steps

1. Add a small licensed/synthetic fixture set and ground-truth manifest.
2. Add a runner that produces CER, WER, field accuracy, and latency summaries.
3. Run both engines in a documented environment.
4. Review the result before selecting the default engine.
5. Add deterministic mocked OCR tests to CI; do not require external model downloads or AI-provider credentials in ordinary CI.

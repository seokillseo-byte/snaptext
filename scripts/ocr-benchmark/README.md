# OCR benchmark utilities

## Validate and rasterize the fixture manifest

From the repository root:

```sh
node scripts/ocr-benchmark/validate-manifest.mjs
node --test scripts/ocr-benchmark/validate-manifest.test.mjs
node --test scripts/ocr-benchmark/score.test.mjs scripts/ocr-benchmark/score-cli.test.mjs scripts/ocr-benchmark/engine-adapters.test.mjs scripts/ocr-benchmark/extract-fields.test.mjs scripts/ocr-benchmark/benchmark-runner.test.mjs
python -m pip install --requirement scripts/ocr-benchmark/requirements-rasterize.txt
python scripts/ocr-benchmark/rasterize.py
node scripts/ocr-benchmark/benchmark-runner.mjs --engine tesseract --manifest artifacts/ocr-benchmark/raster-manifest.json --passes 3 --output artifacts/ocr-benchmark/predictions-tesseract.json --raw-output artifacts/ocr-benchmark/runs-tesseract.json
node scripts/ocr-benchmark/extract-fields.mjs --manifest scripts/ocr-benchmark/manifest.example.json --predictions artifacts/ocr-benchmark/predictions-tesseract.json --output artifacts/ocr-benchmark/predictions-tesseract-fields.json
node scripts/ocr-benchmark/score.mjs scripts/ocr-benchmark/manifest.example.json artifacts/ocr-benchmark/predictions-tesseract-fields.json > artifacts/ocr-benchmark/score-tesseract.json
node scripts/ocr-benchmark/benchmark-runner.mjs --engine paddleocr --manifest artifacts/ocr-benchmark/raster-manifest.json --passes 3 --output artifacts/ocr-benchmark/predictions-paddleocr.json --raw-output artifacts/ocr-benchmark/runs-paddleocr.json
node scripts/ocr-benchmark/extract-fields.mjs --manifest scripts/ocr-benchmark/manifest.example.json --predictions artifacts/ocr-benchmark/predictions-paddleocr.json --output artifacts/ocr-benchmark/predictions-paddleocr-fields.json
node scripts/ocr-benchmark/score.mjs scripts/ocr-benchmark/manifest.example.json artifacts/ocr-benchmark/predictions-paddleocr-fields.json > artifacts/ocr-benchmark/score-paddleocr.json
node scripts/ocr-benchmark/compare-reports.mjs --tesseract artifacts/ocr-benchmark/score-tesseract.json --paddleocr artifacts/ocr-benchmark/score-paddleocr.json --output artifacts/ocr-benchmark/comparison.json
```

Repeat the benchmark command with `--engine paddleocr` and distinct output paths to compare engines on the same rasterized fixtures.

The checked-in fixture pack contains ten deterministic synthetic SVG source images: Vietnamese clean print, low contrast, rotated text, and serif text; English clean invoice-like, multi-line, blurred, and small-text cases; plus perspective/phone-photo-like distortion and Vietnamese mixed-font/skew. They contain no customer data.

The rasterizer writes lossless PNGs and `raster-manifest.json` under `artifacts/ocr-benchmark/`. The provenance manifest records the source SVG SHA-256, output PNG SHA-256, dimensions, language/scenario, Python version, CairoSVG version, and Pillow version. Dependencies are pinned in `requirements-rasterize.txt`; CI uploads the generated files as a short-lived artifact rather than committing generated binaries.

## Repeated-run behavior

The benchmark runner performs one warm-up per fixture, excluded from measurements, followed by three timed passes by default (configurable with `--passes`). It writes scorer-compatible one-prediction-per-fixture JSON using the last successful pass's text/geometry and the median of successful pass latencies. A separate raw-runs JSON preserves each measured pass, per-pass failures, provider versions, and aggregate median/p95 latency. If any measured pass fails, the command exits nonzero after writing both outputs so failures remain inspectable.

## Important limitations

The engine runner has separate Tesseract TSV and PaddleOCR Python-bridge adapters. Install the matching local engine and language models before running it; CI tests adapter parsing with deterministic fakes and does not download large models. Engine failures remain attached to their fixture IDs instead of being silently skipped. The separate field extractor applies per-fixture regex rules stored in the manifest and records missing/invalid rules instead of fabricating values. The scorer consumes supplied predictions; it does not itself invoke OCR engines. No PaddleOCR/Tesseract performance claim should be made until both engines have been run against the same rasterized fixtures and environment. These synthetic examples are a smoke-test set, not a statistically representative evaluation dataset.

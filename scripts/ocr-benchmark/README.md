# OCR benchmark utilities

## Validate and rasterize the fixture manifest

From the repository root:

```sh
node scripts/ocr-benchmark/validate-manifest.mjs
node --test scripts/ocr-benchmark/validate-manifest.test.mjs
node --test scripts/ocr-benchmark/score.test.mjs scripts/ocr-benchmark/score-cli.test.mjs
python -m pip install --requirement scripts/ocr-benchmark/requirements-rasterize.txt
python scripts/ocr-benchmark/rasterize.py
node scripts/ocr-benchmark/engine-adapters.mjs --engine tesseract --manifest artifacts/ocr-benchmark/raster-manifest.json --output artifacts/ocr-benchmark/predictions-tesseract-raw.json
node scripts/ocr-benchmark/extract-fields.mjs --manifest scripts/ocr-benchmark/manifest.example.json --predictions artifacts/ocr-benchmark/predictions-tesseract-raw.json --output artifacts/ocr-benchmark/predictions-tesseract.json
node scripts/ocr-benchmark/score.mjs scripts/ocr-benchmark/manifest.example.json artifacts/ocr-benchmark/predictions-tesseract.json
```

The checked-in fixture pack contains ten deterministic synthetic SVG source images: Vietnamese clean print, low contrast, rotated text, and serif text; plus English clean invoice-like, multi-line, blurred, and small-text cases. They contain no customer data.

The rasterizer writes lossless PNGs and `raster-manifest.json` under `artifacts/ocr-benchmark/`. The provenance manifest records the source SVG SHA-256, output PNG SHA-256, dimensions, language/scenario, Python version, CairoSVG version, and Pillow version. Dependencies are pinned in `requirements-rasterize.txt`; CI uploads the generated files as a short-lived artifact rather than committing generated binaries.

## Important limitations

The engine runner now has separate Tesseract TSV and PaddleOCR Python-bridge adapters. Install the matching local engine and language models before running it; CI tests adapter parsing with deterministic fakes and does not download large models. Engine failures remain attached to their fixture IDs instead of being silently skipped. The adapter reports OCR text and word geometry. The separate field extractor applies per-fixture regex rules stored in the manifest and records missing/invalid rules instead of fabricating values. The scorer consumes supplied predictions; it does not itself invoke OCR engines. No PaddleOCR/Tesseract performance claim should be made until both engines have been run against the same rasterized fixtures and environment. The examples are a small smoke-test set, not a statistically representative evaluation dataset.

Two additional synthetic fixtures now cover perspective/phone-photo-like distortion and mixed fonts with skew. Field accuracy uses explicit per-fixture extraction rules; inspect extraction errors before trusting scores. Then run both real engines in a documented environment. Keep model downloads and hardware-dependent runs out of ordinary CI. Count all failures and preserve raw predictions, configuration, engine versions, and uncertainty.

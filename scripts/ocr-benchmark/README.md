# OCR benchmark utilities

## Validate and rasterize the fixture manifest

From the repository root:

```sh
node scripts/ocr-benchmark/validate-manifest.mjs
node --test scripts/ocr-benchmark/validate-manifest.test.mjs
node --test scripts/ocr-benchmark/score.test.mjs scripts/ocr-benchmark/score-cli.test.mjs
python -m pip install --requirement scripts/ocr-benchmark/requirements-rasterize.txt
python scripts/ocr-benchmark/rasterize.py
```

The checked-in fixture pack contains eight deterministic synthetic SVG source images: Vietnamese clean print, low contrast, rotated text, and serif text; plus English clean invoice-like, multi-line, blurred, and small-text cases. They contain no customer data.

The rasterizer writes lossless PNGs and `raster-manifest.json` under `artifacts/ocr-benchmark/`. The provenance manifest records the source SVG SHA-256, output PNG SHA-256, dimensions, language/scenario, Python version, CairoSVG version, and Pillow version. Dependencies are pinned in `requirements-rasterize.txt`; CI uploads the generated files as a short-lived artifact rather than committing generated binaries.

## Important limitations

The scorer consumes supplied predictions; it does not invoke OCR engines. No PaddleOCR/Tesseract performance claim should be made until both engines have been run against the same rasterized fixtures and environment. The examples are a small smoke-test set, not a statistically representative evaluation dataset.

Next, implement explicit local-engine adapters with deterministic mocked tests, then run the real engines in a documented environment. Keep model downloads and hardware-dependent runs out of ordinary CI. Count all failures and preserve raw predictions, configuration, engine versions, and uncertainty.

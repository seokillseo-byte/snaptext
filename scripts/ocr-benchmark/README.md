# OCR benchmark utilities

## Validate the fixture manifest

From the repository root:

```sh
node scripts/ocr-benchmark/validate-manifest.mjs
node --test scripts/ocr-benchmark/validate-manifest.test.mjs
node --test scripts/ocr-benchmark/score.test.mjs
```

The checked-in fixture pack contains four deterministic synthetic SVG source images: Vietnamese clean print, Vietnamese low contrast, English clean invoice-like text, and English multi-line text. They contain no customer data.

## Important limitation

The SVG files are source fixtures, not raster OCR inputs. Rasterize each SVG to a lossless PNG/TIFF using the same pinned rasterization settings before running an OCR engine. Keep the original SVG, rasterization command/version, output image hash, engine version/configuration, and raw prediction together so runs are reproducible.

The current scorer consumes a manifest and a JSON predictions array; it does not invoke OCR engines. No PaddleOCR/Tesseract performance claim should be made until both engines have been run against the same rasterized fixtures and environment. The examples are a small smoke-test set, not a statistically representative evaluation dataset.

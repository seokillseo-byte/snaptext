#!/usr/bin/env python3
"""Optional PaddleOCR bridge. Install PaddleOCR separately; CI uses mocked adapters."""

from __future__ import annotations

import argparse
import json
import sys
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--language", choices=("vi", "en"), required=True)
    args = parser.parse_args()
    image_path = Path(args.image)
    if not image_path.is_file():
        raise FileNotFoundError(f"Image does not exist: {image_path}")

    try:
        from paddleocr import PaddleOCR
    except ImportError as error:
        raise RuntimeError("PaddleOCR is not installed; install the optional engine environment first.") from error

    try:
        engine_version = version("paddleocr")
    except PackageNotFoundError:
        engine_version = "unknown"

    # PaddleOCR 2.x API; model downloads may occur on first use.
    engine = PaddleOCR(use_angle_cls=True, lang=args.language, show_log=False)
    result = engine.ocr(str(image_path), cls=True)
    words = []
    lines = []
    for page in result or []:
        for item in page or []:
            if not item or len(item) < 2:
                continue
            polygon, recognized = item[0], item[1]
            if not isinstance(recognized, (list, tuple)) or len(recognized) < 2:
                continue
            text, confidence = str(recognized[0]), float(recognized[1])
            if not text.strip():
                continue
            xs = [float(point[0]) for point in polygon]
            ys = [float(point[1]) for point in polygon]
            words.append({
                "text": text,
                "confidence": min(1.0, max(0.0, confidence)),
                "boundingBox": {
                    "x": min(xs), "y": min(ys),
                    "width": max(xs) - min(xs), "height": max(ys) - min(ys),
                },
            })
            lines.append(text)
    print(json.dumps({
        "provider": "paddleocr",
        "providerVersion": engine_version,
        "text": "\n".join(lines),
        "words": words,
        "warnings": [],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"PaddleOCR adapter failed: {error}", file=sys.stderr)
        raise SystemExit(1)

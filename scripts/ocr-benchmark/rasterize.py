#!/usr/bin/env python3
"""Rasterize synthetic SVG OCR fixtures reproducibly and record provenance."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
MANIFEST = SCRIPT_DIR / "manifest.example.json"
OUTPUT_DIR = ROOT / "artifacts" / "ocr-benchmark" / "images"
PROVENANCE_PATH = ROOT / "artifacts" / "ocr-benchmark" / "raster-manifest.json"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != 1 or not isinstance(manifest.get("fixtures"), list):
        raise ValueError("Expected schemaVersion 1 and a fixtures array.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records = []
    seen_ids: set[str] = set()
    for fixture in manifest["fixtures"]:
        fixture_id = fixture.get("id")
        image_ref = fixture.get("image")
        if not isinstance(fixture_id, str) or not fixture_id.strip() or fixture_id in seen_ids:
            raise ValueError(f"Invalid or duplicate fixture id: {fixture_id!r}")
        seen_ids.add(fixture_id)
        if not isinstance(image_ref, str) or not image_ref.strip():
            raise ValueError(f"Fixture {fixture_id} has no image path.")

        source = (MANIFEST.parent / image_ref).resolve()
        if not source.is_relative_to(MANIFEST.parent.resolve()) or source.suffix.lower() != ".svg":
            raise ValueError(f"Fixture {fixture_id} must reference a safe relative SVG path.")
        source_bytes = source.read_bytes()
        if b"<svg" not in source_bytes[:4096]:
            raise ValueError(f"Fixture {fixture_id} does not appear to be an SVG.")

        # Explicit output size, background, and PNG encoding remove metadata variance.
        png_bytes = cairosvg.svg2png(bytestring=source_bytes, output_width=None, output_height=None)
        output_path = OUTPUT_DIR / f"{fixture_id}.png"
        output_path.write_bytes(png_bytes)
        with Image.open(output_path) as image:
            image.load()
            if image.format != "PNG" or image.width < 1 or image.height < 1:
                raise ValueError(f"Rasterizer produced an invalid PNG for {fixture_id}.")
            dimensions = {"width": image.width, "height": image.height}
            # Re-encode with pinned Pillow to normalize PNG metadata and compression.
            image.save(output_path, format="PNG", optimize=False, compress_level=9)
        raster_bytes = output_path.read_bytes()
        records.append({
            "id": fixture_id,
            "language": fixture.get("language"),
            "scenario": fixture.get("scenario", []),
            "source": source.relative_to(ROOT).as_posix(),
            "sourceSha256": sha256(source_bytes),
            "image": output_path.relative_to(ROOT).as_posix(),
            "imageSha256": sha256(raster_bytes),
            "mimeType": "image/png",
            **dimensions,
        })

    report = {
        "schemaVersion": 1,
        "rasterizer": {
            "name": "CairoSVG",
            "version": cairosvg.__version__,
            "pillowVersion": __import__("PIL").__version__,
            "pythonVersion": sys.version.split()[0],
            "format": "PNG",
            "compressionLevel": 9,
        },
        "fixtureCount": len(records),
        "fixtures": records,
    }
    PROVENANCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROVENANCE_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "fixtureCount": len(records),
        "rasterizer": report["rasterizer"],
        "manifest": str(PROVENANCE_PATH.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"OCR fixture rasterization failed: {error}", file=sys.stderr)
        raise SystemExit(1)

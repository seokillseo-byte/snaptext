#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function extractFields(text, patterns = {}) {
  const fields = {};
  const errors = [];
  for (const [key, source] of Object.entries(patterns)) {
    if (typeof source !== "string" || !source) {
      errors.push({ field: key, code: "INVALID_PATTERN" });
      continue;
    }
    try {
      const match = new RegExp(source, "imu").exec(String(text ?? ""));
      if (!match || typeof match[1] !== "string" || !match[1].trim()) {
        errors.push({ field: key, code: "FIELD_NOT_FOUND" });
        continue;
      }
      fields[key] = match[1].normalize("NFC").trim().replace(/\s+/gu, " ");
    } catch (error) {
      errors.push({ field: key, code: "INVALID_PATTERN", message: error instanceof Error ? error.message : "Invalid pattern" });
    }
  }
  return { fields, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const manifestPath = value("--manifest");
  const predictionsPath = value("--predictions");
  const outputPath = value("--output");
  if (!manifestPath || !predictionsPath || !outputPath) {
    console.error("Usage: node scripts/ocr-benchmark/extract-fields.mjs --manifest <manifest.json> --predictions <predictions.json> --output <predictions-with-fields.json>");
    process.exitCode = 2;
    return;
  }
  const [manifest, predictions] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    readFile(predictionsPath, "utf8").then(JSON.parse)
  ]);
  if (!Array.isArray(manifest.fixtures) || !Array.isArray(predictions)) throw new Error("Manifest fixtures and predictions must be arrays.");
  const fixtures = new Map(manifest.fixtures.map((fixture) => [fixture.id, fixture]));
  const enriched = predictions.map((prediction) => {
    const fixture = fixtures.get(prediction.id);
    if (!fixture) return { ...prediction, fields: {}, fieldExtractionErrors: [{ code: "UNKNOWN_FIXTURE" }] };
    if (prediction.error) return { ...prediction, fields: {}, fieldExtractionErrors: [] };
    const result = extractFields(prediction.text, fixture.fieldPatterns ?? {});
    return { ...prediction, fields: result.fields, fieldExtractionErrors: result.errors };
  });
  const target = path.resolve(outputPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(enriched, null, 2) + "\n", "utf8");
  const errors = enriched.reduce((sum, item) => sum + (item.fieldExtractionErrors?.length ?? 0), 0);
  console.log(JSON.stringify({ fixtureCount: enriched.length, extractionErrors: errors, output: target }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : "Field extraction failed."); process.exitCode = 1; });
}

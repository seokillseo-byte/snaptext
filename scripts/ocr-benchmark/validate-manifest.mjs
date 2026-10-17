#!/usr/bin/env node
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function validateManifest(manifestPath) {
  const absoluteManifest = path.resolve(manifestPath);
  const manifest = JSON.parse(await readFile(absoluteManifest, "utf8"));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.fixtures)) {
    throw new Error("Manifest must use schemaVersion 1 and contain a fixtures array.");
  }
  const ids = new Set();
  for (const fixture of manifest.fixtures) {
    if (!fixture || typeof fixture.id !== "string" || !fixture.id.trim()) {
      throw new Error("Every fixture must have a non-empty id.");
    }
    if (ids.has(fixture.id)) throw new Error(`Duplicate fixture id: ${fixture.id}`);
    ids.add(fixture.id);
    if (!["vi", "en"].includes(fixture.language)) {
      throw new Error(`Fixture ${fixture.id} has unsupported language; expected vi or en.`);
    }
    if (!Array.isArray(fixture.scenario) || fixture.scenario.length === 0) {
      throw new Error(`Fixture ${fixture.id} must have scenario tags.`);
    }
    if (typeof fixture.groundTruthText !== "string" || !fixture.groundTruthText.trim()) {
      throw new Error(`Fixture ${fixture.id} must have groundTruthText.`);
    }
    if (!fixture.groundTruthFields || typeof fixture.groundTruthFields !== "object" || Array.isArray(fixture.groundTruthFields)) {
      throw new Error(`Fixture ${fixture.id} must have groundTruthFields.`);
    }
    if (typeof fixture.image !== "string" || !fixture.image.trim() || path.isAbsolute(fixture.image) ||
        fixture.image.split(/[\\/]/u).includes("..")) {
      throw new Error(`Fixture ${fixture.id} has an unsafe image path.`);
    }
    const imagePath = path.resolve(path.dirname(absoluteManifest), fixture.image);
    const relative = path.relative(path.dirname(absoluteManifest), imagePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Fixture ${fixture.id} image path escapes the manifest directory.`);
    }
    await access(imagePath);
  }
  return { fixtureCount: manifest.fixtures.length, ids: [...ids] };
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  const manifestPath = process.argv[2] ?? path.join(path.dirname(thisFile), "manifest.example.json");
  validateManifest(manifestPath)
    .then((result) => console.log(JSON.stringify({ valid: true, ...result }, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Manifest validation failed.");
      process.exitCode = 1;
    });
}

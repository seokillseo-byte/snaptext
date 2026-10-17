import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scorer = path.join(here, "score.mjs");

async function withInputs(manifest, predictions, run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "snaptext-ocr-score-"));
  try {
    const manifestPath = path.join(dir, "manifest.json");
    const predictionsPath = path.join(dir, "predictions.json");
    await writeFile(manifestPath, JSON.stringify(manifest));
    await writeFile(predictionsPath, JSON.stringify(predictions));
    await run(manifestPath, predictionsPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("CLI reports metrics grouped by language and scenario", async () => {
  const manifest = { fixtures: [
    { id: "vi-1", language: "vi", scenario: ["clean"], groundTruthText: "Xin chào", groundTruthFields: { greeting: "Xin chào" } },
    { id: "en-1", language: "en", scenario: ["blur"], groundTruthText: "Hello", groundTruthFields: { greeting: "Hello" } }
  ] };
  const predictions = [
    { id: "vi-1", text: "Xin chào", fields: { greeting: "Xin chào" }, latencyMs: 10 },
    { id: "en-1", text: "Hello", fields: { greeting: "Hello" }, latencyMs: 20 }
  ];
  await withInputs(manifest, predictions, (manifestPath, predictionsPath) => {
    const result = spawnSync(process.execPath, [scorer, manifestPath, predictionsPath], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.byLanguage.en.fixtureCount, 1);
    assert.equal(report.byLanguage.vi.meanCer, 0);
    assert.equal(report.byScenario.clean.fixtureCount, 1);
    assert.equal(report.summary.failureRate, 0);
  });
});

test("CLI fails on duplicate prediction IDs instead of silently overwriting", async () => {
  const manifest = { fixtures: [
    { id: "en-1", language: "en", scenario: ["clean"], groundTruthText: "Hello", groundTruthFields: {} }
  ] };
  const predictions = [
    { id: "en-1", text: "Hello", fields: {}, latencyMs: 1 },
    { id: "en-1", text: "H3llo", fields: {}, latencyMs: 2 }
  ];
  await withInputs(manifest, predictions, (manifestPath, predictionsPath) => {
    const result = spawnSync(process.execPath, [scorer, manifestPath, predictionsPath], { encoding: "utf8" });
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(report.duplicatePredictionIds, ["en-1"]);
  });
});

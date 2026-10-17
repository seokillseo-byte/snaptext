#!/usr/bin/env node
import { readFile } from "node:fs/promises";

function normalize(value) {
  return String(value ?? "").normalize("NFC").trim().replace(/\s+/gu, " ");
}

function tokens(value) {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ") : [];
}

function editDistance(left, right) {
  const a = Array.from(left);
  const b = Array.from(right);
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function errorRate(reference, hypothesis, tokenize) {
  const expected = tokenize(reference);
  if (expected.length === 0) return tokenize(hypothesis).length === 0 ? 0 : 1;
  return editDistance(expected, tokenize(hypothesis)) / expected.length;
}

export function scoreFixture(fixture, prediction) {
  const failed = prediction.error != null;
  const expectedFields = fixture.groundTruthFields ?? {};
  const fieldEntries = Object.entries(expectedFields);
  // Failed engine runs have no meaningful OCR accuracy. Keep those metrics null
  // instead of reporting an artificial 100% error rate from an empty string.
  if (failed) {
    return {
      id: fixture.id,
      cer: null,
      wer: null,
      fieldAccuracy: null,
      matchedFields: 0,
      totalFields: fieldEntries.length,
      failed: true,
      latencyMs: Number.isFinite(prediction.latencyMs) ? prediction.latencyMs : null
    };
  }

  const referenceText = normalize(fixture.groundTruthText);
  const predictedText = normalize(prediction.text);
  const predictedFields = prediction.fields ?? {};
  const matchedFields = fieldEntries.filter(([key, value]) =>
    normalize(predictedFields[key]) === normalize(value)
  ).length;

  return {
    id: fixture.id,
    cer: errorRate(referenceText, predictedText, (value) => Array.from(value)),
    wer: errorRate(referenceText, predictedText, tokens),
    fieldAccuracy: fieldEntries.length ? matchedFields / fieldEntries.length : null,
    matchedFields,
    totalFields: fieldEntries.length,
    failed: false,
    latencyMs: Number.isFinite(prediction.latencyMs) ? prediction.latencyMs : null
  };
}

function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1)];
}

export function summarize(scores) {
  const successful = scores.filter((score) => !score.failed);
  const average = (key) => {
    const values = successful.map((score) => score[key]).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  // Latency measures engine execution, so failed runs still contribute when timing is available.\n  const latencies = scores.map((score) => score.latencyMs).filter(Number.isFinite);
  return {
    fixtureCount: scores.length,
    failureRate: scores.length ? scores.filter((score) => score.failed).length / scores.length : 0,
    meanCer: average("cer"),
    meanWer: average("wer"),
    meanFieldAccuracy: average("fieldAccuracy"),
    medianLatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95)
  };
}

async function main() {
  const [manifestPath, predictionsPath] = process.argv.slice(2);
  if (!manifestPath || !predictionsPath) {
    console.error("Usage: node scripts/ocr-benchmark/score.mjs <manifest.json> <predictions.json>");
    process.exitCode = 2;
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const predictions = JSON.parse(await readFile(predictionsPath, "utf8"));
  if (!Array.isArray(manifest.fixtures) || !Array.isArray(predictions)) {
    throw new Error("Manifest must contain a fixtures array; predictions must be an array.");
  }

  const predictionIds = new Set();
  const duplicatePredictionIds = new Set();
  for (const prediction of predictions) {
    if (!prediction || typeof prediction.id !== "string" || !prediction.id.trim()) {
      throw new Error("Every prediction must have a non-empty string id.");
    }
    if (predictionIds.has(prediction.id)) duplicatePredictionIds.add(prediction.id);
    predictionIds.add(prediction.id);
  }
  const byId = new Map(predictions.map((prediction) => [prediction.id, prediction]));
  const scores = manifest.fixtures.map((fixture) => {
    const prediction = byId.get(fixture.id);
    if (!prediction) {
      return { id: fixture.id, language: fixture.language, scenario: fixture.scenario ?? [], cer: null, wer: null, fieldAccuracy: null, failed: true, latencyMs: null, error: "missing_prediction" };
    }
    return { ...scoreFixture(fixture, prediction), language: fixture.language, scenario: fixture.scenario ?? [] };
  });
  const fixtureIds = new Set(manifest.fixtures.map((fixture) => fixture.id));
  const extraPredictionIds = predictions.map((prediction) => prediction.id)
    .filter((id) => !fixtureIds.has(id));
  const groupBy = (key, valueFor) => {
    const groups = new Map();
    for (const score of scores) {
      const value = valueFor(score);
      const groupKey = Array.isArray(value) ? value.join(", ") : String(value ?? "unknown");
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(score);
    }
    return Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => [name, summarize(items)]));
  };

  console.log(JSON.stringify({
    schemaVersion: 1,
    normalization: "Unicode NFC; trim and collapse whitespace; word tokens split on whitespace",
    summary: summarize(scores),
    byLanguage: groupBy("language", (score) => score.language),
    byScenario: groupBy("scenario", (score) => score.scenario),
    scores,
    extraPredictionIds,
    duplicatePredictionIds: [...duplicatePredictionIds]
  }, null, 2));
  if (extraPredictionIds.length || duplicatePredictionIds.size) process.exitCode = 1;
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Benchmark scoring failed.");
    process.exitCode = 1;
  });
}

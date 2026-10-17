import test from "node:test";
import assert from "node:assert/strict";
import { scoreFixture, summarize } from "./score.mjs";

test("scores Vietnamese text after Unicode NFC normalization", () => {
  const fixture = {
    id: "vi-1",
    groundTruthText: "Nguyễn Văn An Hà Nội",
    groundTruthFields: { fullName: "Nguyễn Văn An", city: "Hà Nội" }
  };
  const prediction = {
    text: "Nguye\u0302\u0303n Va\u0306n An Ha\u0300 No\u0302\u0323i",
    fields: { fullName: "Nguyễn Văn An", city: "Hà Nội" },
    latencyMs: 20
  };
  const score = scoreFixture(fixture, prediction);
  assert.equal(score.cer, 0);
  assert.equal(score.wer, 0);
  assert.equal(score.fieldAccuracy, 1);
  assert.equal(score.failed, false);
});

test("reports substitutions and field mismatch", () => {
  const score = scoreFixture(
    { id: "en-1", groundTruthText: "Invoice 123", groundTruthFields: { invoiceNumber: "123" } },
    { text: "Invoice 128", fields: { invoiceNumber: "128" }, latencyMs: 15 }
  );
  assert.ok(score.cer > 0);
  assert.ok(score.wer > 0);
  assert.equal(score.fieldAccuracy, 0);
});

test("missing predictions count as failures in the CLI contract", () => {
  const score = { id: "missing", failed: true, cer: null, wer: null, fieldAccuracy: null, latencyMs: null };
  const summary = summarize([score]);
  assert.equal(summary.fixtureCount, 1);
  assert.equal(summary.failureRate, 1);
  assert.equal(summary.meanCer, null);
  assert.equal(summary.medianLatencyMs, null);
});

test("summarizes latency and ignores failed records for accuracy", () => {
  const summary = summarize([
    { failed: false, cer: 0.1, wer: 0.2, fieldAccuracy: 1, latencyMs: 10 },
    { failed: false, cer: 0.3, wer: 0.4, fieldAccuracy: 0.5, latencyMs: 30 },
    { failed: true, cer: null, wer: null, fieldAccuracy: null, latencyMs: null }
  ]);
  assert.equal(summary.failureRate, 1 / 3);
  assert.equal(summary.meanCer, 0.2);
  assert.ok(Math.abs(summary.meanWer - 0.3) < Number.EPSILON * 2);
  assert.equal(summary.meanFieldAccuracy, 0.75);
  assert.equal(summary.medianLatencyMs, 10);
  assert.equal(summary.p95LatencyMs, 30);
});

test("normalizes decomposed Vietnamese city names including circumflex and dot-below", () => {
  const score = scoreFixture(
    { id: "vi-city", groundTruthText: "Hà Nội", groundTruthFields: { city: "Hà Nội" } },
    { text: "Ha\\u0300 No\\u0302\\u0323i", fields: { city: "Ha\\u0300 No\\u0302\\u0323i" }, latencyMs: 1 }
  );
  assert.equal(score.cer, 0);
  assert.equal(score.wer, 0);
  assert.equal(score.fieldAccuracy, 1);
});

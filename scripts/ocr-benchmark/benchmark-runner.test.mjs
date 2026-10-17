import test from "node:test";
import assert from "node:assert/strict";
import { median, percentile, runBenchmark } from "./benchmark-runner.mjs";

test("runs one warm-up and measured passes, using median latency for scorer-compatible predictions", async () => {
  let calls = 0;
  let tick = 0;
  const result = await runBenchmark({
    fixtures: [{ id: "a", image: "a.png", language: "en" }],
    passes: 3,
    clock: () => tick,
    runner: () => {
      calls += 1;
      tick += calls === 1 ? 100 : calls === 2 ? 10 : calls === 3 ? 30 : 20;
      return { text: `text-${calls}`, words: [], provider: "fake", providerVersion: "1", warnings: [] };
    }
  });
  assert.equal(calls, 4);
  assert.equal(result.rawRuns.length, 3);
  assert.equal(result.predictions.length, 1);
  assert.equal(result.predictions[0].text, "text-4");
  assert.equal(result.predictions[0].latencyMs, 20);
  assert.equal(result.summary.successfulRuns, 3);
});

test("keeps failed measured passes and reports aggregate latency percentiles", async () => {
  let calls = 0;
  const result = await runBenchmark({
    fixtures: [{ id: "a", image: "a.png", language: "en" }],
    passes: 2,
    clock: (() => { let t = 0; return () => ++t; })(),
    runner: () => { calls += 1; if (calls === 2) throw new Error("bad OCR"); return { text: "ok", words: [], provider: "fake", providerVersion: "1" }; }
  });
  assert.equal(result.summary.failedRuns, 1);
  assert.equal(result.rawRuns.length, 2);
  assert.equal(result.predictions[0].successfulPasses, 1);
  assert.equal(median([10, 30, 20]), 20);
  assert.equal(percentile([10, 20, 30, 40], 0.95), 40);
});

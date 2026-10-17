import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPaddleOCR, runTesseract } from "./engine-adapters.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function runBenchmark({ fixtures, runner, passes = 3, clock = () => performance.now() }) {
  if (!Number.isInteger(passes) || passes < 1) throw new Error("passes must be a positive integer");
  const predictions = [];
  const rawRuns = [];
  for (const fixture of fixtures) {
    const input = { ...fixture, image: path.resolve(fixture.image) };
    // Warm-up is deliberately excluded from latency statistics and saved raw runs.
    try { runner({ imagePath: input.image, language: input.language }); } catch { /* captured in measured runs */ }
    const measured = [];
    for (let pass = 1; pass <= passes; pass += 1) {
      const started = clock();
      try {
        const result = runner({ imagePath: input.image, language: input.language });
        const latencyMs = Math.max(0, clock() - started);
        measured.push({ id: fixture.id, pass, ok: true, latencyMs, ...result });
      } catch (error) {
        const latencyMs = Math.max(0, clock() - started);
        measured.push({
          id: fixture.id, pass, ok: false, latencyMs, text: "", words: [], provider: null,
          providerVersion: null, warnings: [],
          error: { code: error?.code ?? "ENGINE_FAILED", message: error instanceof Error ? error.message : "OCR engine failed." }
        });
      }
    }
    rawRuns.push(...measured);
    const successful = measured.filter((run) => run.ok);
    const representative = successful.at(-1) ?? measured.at(-1);
    predictions.push({
      id: fixture.id,
      text: representative.text,
      fields: {},
      latencyMs: median(successful.map((run) => run.latencyMs)),
      provider: representative.provider,
      providerVersion: representative.providerVersion,
      words: representative.words,
      warnings: representative.warnings ?? [],
      passCount: passes,
      successfulPasses: successful.length,
      latencySamplesMs: successful.map((run) => run.latencyMs),
      ...(successful.length ? {} : { error: representative.error })
    });
  }
  const latencies = rawRuns.filter((run) => run.ok).map((run) => run.latencyMs);
  return {
    predictions,
    rawRuns,
    summary: {
      fixtureCount: fixtures.length,
      passCount: passes,
      measuredRuns: rawRuns.length,
      successfulRuns: rawRuns.filter((run) => run.ok).length,
      failedRuns: rawRuns.filter((run) => !run.ok).length,
      medianLatencyMs: median(latencies),
      p95LatencyMs: percentile(latencies, 0.95)
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const engine = value("--engine");
  const manifestPath = value("--manifest");
  const outputPath = value("--output");
  const rawOutputPath = value("--raw-output");
  const passes = Number(value("--passes") ?? 3);
  if (!["tesseract", "paddleocr"].includes(engine) || !manifestPath || !outputPath || !rawOutputPath || !Number.isInteger(passes) || passes < 1) {
    console.error("Usage: node scripts/ocr-benchmark/benchmark-runner.mjs --engine tesseract|paddleocr --manifest <raster-manifest.json> --passes 3 --output <predictions.json> --raw-output <raw-runs.json>");
    process.exitCode = 2;
    return;
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest.fixtures)) throw new Error("Raster manifest must contain a fixtures array.");
  const runner = engine === "tesseract" ? runTesseract : runPaddleOCR;
  const result = await runBenchmark({ fixtures: manifest.fixtures, runner, passes });
  const output = path.resolve(outputPath);
  const rawOutput = path.resolve(rawOutputPath);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.dirname(rawOutput), { recursive: true });
  await writeFile(output, JSON.stringify(result.predictions, null, 2) + "\n", "utf8");
  await writeFile(rawOutput, JSON.stringify({ engine, summary: result.summary, runs: result.rawRuns }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ engine, ...result.summary, output, rawOutput }, null, 2));
  if (result.summary.failedRuns) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : "Benchmark run failed."); process.exitCode = 1; });
}

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paddleBridge = path.join(here, "paddleocr_adapter.py");

function execute(command, args, spawn = spawnSync) {
  const result = spawn(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  if (result.error) throw Object.assign(new Error(result.error.message), { code: "ENGINE_LAUNCH_FAILED" });
  if (result.status !== 0) {
    throw Object.assign(new Error((result.stderr || `${command} exited with status ${result.status}`).trim()), {
      code: "ENGINE_FAILED",
      exitCode: result.status
    });
  }
  return result.stdout ?? "";
}

function parseTesseractTsv(tsv) {
  const lines = tsv.trim().split(/\r?\n/u);
  if (lines.length < 2) throw Object.assign(new Error("Tesseract returned no TSV header or rows."), { code: "INVALID_ENGINE_OUTPUT" });
  const headers = lines[0].split("\t");
  const index = Object.fromEntries(headers.map((name, i) => [name, i]));
  for (const required of ["level", "block_num", "par_num", "line_num", "left", "top", "width", "height", "conf", "text"]) {
    if (index[required] === undefined) throw Object.assign(new Error(`Tesseract TSV is missing ${required}.`), { code: "INVALID_ENGINE_OUTPUT" });
  }
  const words = [];
  const linesById = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    if (columns[index.level] !== "5") continue;
    const text = (columns[index.text] ?? "").trim();
    const confidence = Number(columns[index.conf]);
    if (!text || !Number.isFinite(confidence) || confidence < 0) continue;
    const word = {
      text,
      confidence: Math.min(1, Math.max(0, confidence / 100)),
      boundingBox: {
        x: Number(columns[index.left]), y: Number(columns[index.top]),
        width: Number(columns[index.width]), height: Number(columns[index.height])
      }
    };
    words.push(word);
    const key = ["page_num", "block_num", "par_num", "line_num"].map((name) => columns[index[name]] ?? "0").join(":");
    if (!linesById.has(key)) linesById.set(key, []);
    linesById.get(key).push(text);
  }
  return { text: [...linesById.values()].map((lineWords) => lineWords.join(" ")).join("\n"), words };
}

function tesseractLanguage(language) {
  const map = { vi: "vie", en: "eng", "vi,en": "vie+eng", "en,vi": "eng+vie" };
  const key = Array.isArray(language) ? language.join(",") : String(language || "en");
  if (!map[key]) throw Object.assign(new Error(`Unsupported Tesseract language hint: ${key}`), { code: "UNSUPPORTED_LANGUAGE" });
  return map[key];
}

export function runTesseract({ imagePath, language, command = "tesseract", spawn = spawnSync }) {
  const versionOutput = execute(command, ["--version"], spawn);
  const providerVersion = (versionOutput.split(/\r?\n/u)[0] || "").trim();
  if (!providerVersion) throw Object.assign(new Error("Tesseract version could not be determined."), { code: "INVALID_ENGINE_OUTPUT" });
  const tsv = execute(command, [imagePath, "stdout", "-l", tesseractLanguage(language), "--psm", "6", "tsv"], spawn);
  return { ...parseTesseractTsv(tsv), provider: "tesseract", providerVersion, warnings: [] };
}

export function runPaddleOCR({ imagePath, language, python = "python3", spawn = spawnSync }) {
  const languageKey = Array.isArray(language) ? language[0] : String(language || "en");
  if (!["vi", "en"].includes(languageKey)) {
    throw Object.assign(new Error(`Unsupported PaddleOCR language hint: ${languageKey}`), { code: "UNSUPPORTED_LANGUAGE" });
  }
  const stdout = execute(python, [paddleBridge, "--image", imagePath, "--language", languageKey], spawn);
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw Object.assign(new Error("PaddleOCR adapter returned invalid JSON."), { code: "INVALID_ENGINE_OUTPUT" });
  }
  if (!result || typeof result.text !== "string" || !Array.isArray(result.words) || !result.providerVersion) {
    throw Object.assign(new Error("PaddleOCR adapter output is missing required fields."), { code: "INVALID_ENGINE_OUTPUT" });
  }
  return { text: result.text, words: result.words, provider: "paddleocr", providerVersion: String(result.providerVersion), warnings: result.warnings ?? [] };
}

export function createPrediction(fixture, runner) {
  const started = performance.now();
  try {
    const result = runner({ imagePath: fixture.image, language: fixture.language });
    return {
      id: fixture.id, text: result.text, fields: {}, latencyMs: Math.max(0, performance.now() - started),
      provider: result.provider, providerVersion: result.providerVersion, words: result.words, warnings: result.warnings ?? []
    };
  } catch (error) {
    return {
      id: fixture.id, text: "", fields: {}, latencyMs: null,
      provider: null, providerVersion: null, words: [], warnings: [],
      error: { code: error?.code ?? "ENGINE_FAILED", message: error instanceof Error ? error.message : "OCR engine failed." }
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const engine = value("--engine");
  const manifestPath = value("--manifest");
  const outputPath = value("--output");
  if (!["tesseract", "paddleocr"].includes(engine) || !manifestPath || !outputPath) {
    console.error("Usage: node scripts/ocr-benchmark/engine-runner.mjs --engine tesseract|paddleocr --manifest <raster-manifest.json> --output <predictions.json>");
    process.exitCode = 2;
    return;
  }
  const { readFile, writeFile, mkdir } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest.fixtures)) throw new Error("Raster manifest must contain a fixtures array.");
  const runner = engine === "tesseract" ? runTesseract : runPaddleOCR;
  const predictions = manifest.fixtures.map((fixture) => {
    const imagePath = path.resolve(fixture.image);
    return createPrediction({ ...fixture, image: imagePath }, runner);
  });
  const result = {
    schemaVersion: 1, engine,
    fixtureCount: predictions.length,
    failureCount: predictions.filter((prediction) => prediction.error).length,
    predictions
  };
  const target = path.resolve(outputPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ engine, fixtureCount: result.fixtureCount, failureCount: result.failureCount, output: target }, null, 2));
  if (result.failureCount) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "OCR benchmark runner failed.");
    process.exitCode = 1;
  });
}

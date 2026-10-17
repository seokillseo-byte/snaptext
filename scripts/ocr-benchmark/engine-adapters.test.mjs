import test from "node:test";
import assert from "node:assert/strict";
import { runTesseract, runPaddleOCR, createPrediction } from "./engine-adapters.mjs";

function fakeSpawn(outputs) {
  let call = 0;
  return (_command, _args, _options) => {
    const result = outputs[call++];
    if (result instanceof Error) return { error: result, status: null, stdout: "", stderr: "" };
    return { status: result.status ?? 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  };
}

const tsv = [
  "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext",
  "5\t1\t1\t1\t1\t1\t10\t20\t40\t12\t98.5\tXin",
  "5\t1\t1\t1\t1\t2\t55\t20\t42\t12\t90\tchào",
  "5\t1\t1\t1\t2\t1\t10\t40\t40\t12\t80\tViệt"
].join("\n");

test("Tesseract adapter parses TSV, preserves lines, confidence, and boxes", () => {
  const result = runTesseract({
    imagePath: "/tmp/fake.png", language: "vi",
    spawn: fakeSpawn([{ stdout: "tesseract 5.4.1\n" }, { stdout: tsv }])
  });
  assert.equal(result.provider, "tesseract");
  assert.equal(result.providerVersion, "tesseract 5.4.1");
  assert.equal(result.text, "Xin chào\nViệt");
  assert.equal(result.words.length, 3);
  assert.equal(result.words[0].confidence, 0.985);
  assert.deepEqual(result.words[0].boundingBox, { x: 10, y: 20, width: 40, height: 12 });
});

test("Tesseract adapter rejects unsupported languages explicitly", () => {
  assert.throws(() => runTesseract({
    imagePath: "/tmp/fake.png", language: "fr",
    spawn: fakeSpawn([{ stdout: "tesseract 5.4.1\n" }])
  }), { code: "UNSUPPORTED_LANGUAGE" });
});

test("PaddleOCR adapter validates JSON and returns normalized provider metadata", () => {
  const result = runPaddleOCR({
    imagePath: "/tmp/fake.png", language: "vi",
    spawn: fakeSpawn([{ stdout: JSON.stringify({ providerVersion: "2.9.1", text: "Hà Nội", words: [], warnings: [] }) }])
  });
  assert.equal(result.provider, "paddleocr");
  assert.equal(result.providerVersion, "2.9.1");
  assert.equal(result.text, "Hà Nội");
});

test("runner records adapter errors as failed predictions instead of dropping fixtures", () => {
  const prediction = createPrediction({ id: "vi-1", image: "/tmp/fake.png", language: "vi" }, () => {
    throw Object.assign(new Error("engine unavailable"), { code: "ENGINE_LAUNCH_FAILED" });
  });
  assert.equal(prediction.id, "vi-1");
  assert.equal(prediction.error.code, "ENGINE_LAUNCH_FAILED");
  assert.equal(prediction.text, "");
});

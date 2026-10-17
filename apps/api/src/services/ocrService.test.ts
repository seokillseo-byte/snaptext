import test from "node:test";
import assert from "node:assert/strict";
import { OcrNotConfiguredError, OcrService, type OcrProvider } from "./ocrService.js";

const validInput = { imageBuffer: Buffer.from("synthetic"), mimeType: "image/png" as const };

test("does not silently fall back when no local OCR provider is configured", async () => {
  const service = new OcrService();
  await assert.rejects(service.recognize(validInput), OcrNotConfiguredError);
});

test("rejects empty image content", async () => {
  const provider: OcrProvider = {
    id: "test-local",
    version: "1",
    async recognize() {
      return { text: "", words: [], provider: "ignored", providerVersion: "ignored", durationMs: 1, warnings: [] };
    }
  };
  await assert.rejects(new OcrService(provider).recognize({ ...validInput, imageBuffer: Buffer.alloc(0) }), {
    code: "INVALID_IMAGE"
  });
});

test("preserves provider warnings and reports provider metadata", async () => {
  const provider: OcrProvider = {
    id: "fake-local",
    version: "test-1",
    async recognize() {
      return {
        text: "Hà Nội",
        words: [{ text: "Hà", confidence: 0.98 }, { text: "Nội", confidence: 0.75 }],
        provider: "untrusted-provider-label",
        providerVersion: "untrusted-version",
        durationMs: -1,
        warnings: ["low confidence on one word"]
      };
    }
  };
  const result = await new OcrService(provider).recognize(validInput);
  assert.equal(result.provider, "fake-local");
  assert.equal(result.providerVersion, "test-1");
  assert.equal(result.durationMs, 0);
  assert.equal(result.text, "Hà Nội");
  assert.equal(result.words.length, 2);
  assert.deepEqual(result.warnings, ["low confidence on one word"]);
});

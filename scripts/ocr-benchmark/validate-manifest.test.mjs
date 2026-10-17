import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateManifest } from "./validate-manifest.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("validates the checked-in synthetic bilingual fixture manifest", async () => {
  const result = await validateManifest(path.join(here, "manifest.example.json"));
  assert.equal(result.fixtureCount, 8);
  assert.deepEqual(result.ids, ["vi-clean-001", "vi-low-contrast-001", "en-clean-001", "en-multiline-001", "vi-rotated-001", "en-blurred-001", "vi-serif-001", "en-small-text-001"]);
});

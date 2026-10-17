import test from "node:test";
import assert from "node:assert/strict";
import { extractFields } from "./extract-fields.mjs";

test("extracts labeled fields and normalizes Unicode", () => {
  const result = extractFields("Invoice Number: INV-001\nTotal Due: 125.50 USD", {
    invoiceNumber: "Invoice Number:\\s*([A-Z]+-\\d+)",
    totalDue: "Total Due:\\s*([\\d.]+\\s+USD)"
  });
  assert.deepEqual(result.fields, { invoiceNumber: "INV-001", totalDue: "125.50 USD" });
  assert.deepEqual(result.errors, []);
});

test("reports missing and invalid extraction rules without inventing values", () => {
  const result = extractFields("No labeled fields", { city: "City:\\s*([^\\r\\n]+)", bad: "[" });
  assert.deepEqual(result.fields, {});
  assert.deepEqual(result.errors.map((error) => error.code), ["FIELD_NOT_FOUND", "INVALID_PATTERN"]);
});

test("preserves the rest of a line as a field value", () => {
  const result = extractFields("Đơn vị: Kho Hà Nội", { site: "Đơn vị:\\s*([^\\r\\n]+)" });
  assert.equal(result.fields.site, "Kho Hà Nội");
});

import test from "node:test";
import assert from "node:assert/strict";
import { extractFields } from "./extract-fields.mjs";

test("extracts and normalizes captured fields", () => {
  const result = extractFields(
    "Invoice Number: INV-001\nTotal Due: 125.50   USD",
    {
      invoiceNumber: "Invoice Number:\\s*([A-Z]+-\\d+)",
      totalDue: "Total Due:\\s*([\\d.]+\\s+USD)"
    }
  );
  assert.deepEqual(result.fields, { invoiceNumber: "INV-001", totalDue: "125.50 USD" });
  assert.deepEqual(result.errors, []);
});

test("reports missing fields without inventing a value", () => {
  const result = extractFields("Invoice Number: INV-001", {
    invoiceNumber: "Invoice Number:\\s*([A-Z]+-\\d+)",
    dueDate: "Due Date:\\s*(\\d{4}-\\d{2}-\\d{2})"
  });
  assert.equal(result.fields.invoiceNumber, "INV-001");
  assert.equal("dueDate" in result.fields, false);
  assert.deepEqual(result.errors, [{ field: "dueDate", code: "FIELD_NOT_FOUND" }]);
});

test("contains invalid regular expressions as field-level errors", () => {
  const result = extractFields("Some text", {
    brokenPattern: "(",
    goodField: "Reference:\\s*(SR-\\d+)"
  });
  assert.equal("brokenPattern" in result.fields, false);
  assert.deepEqual(result.errors.map(({ field, code }) => ({ field, code })), [
    { field: "brokenPattern", code: "INVALID_PATTERN" },
    { field: "goodField", code: "FIELD_NOT_FOUND" }
  ]);
});

test("does not accept empty captures", () => {
  const result = extractFields("Vendor:   ", { vendor: "Vendor:\\s*(.*)" });
  assert.equal("vendor" in result.fields, false);
  assert.deepEqual(result.errors, [{ field: "vendor", code: "FIELD_NOT_FOUND" }]);
});

test("supports Vietnamese text and preserves normalized Unicode", () => {
  const result = extractFields("Địa chỉ: Ha\u0300 No\u0302\u0323i", {
    city: "Địa chỉ:\\s*([^\\r\\n]+)"
  });
  assert.equal(result.fields.city, "Hà Nội");
  assert.deepEqual(result.errors, []);
});

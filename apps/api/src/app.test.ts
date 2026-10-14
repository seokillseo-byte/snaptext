import assert from "node:assert/strict";
import { after, test } from "node:test";
import request from "supertest";
import { app } from "./app.js";
import { closePool } from "./db/pool.js";

after(async () => {
  await closePool();
});

test("GET /api/health returns service health", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "snaptext-api");
  assert.equal(typeof response.body.timestamp, "string");
});

test("GET /api/health/ready reports missing database configuration", {
  skip: Boolean(process.env.DATABASE_URL)
}, async () => {
  const response = await request(app).get("/api/health/ready");

  assert.equal(response.status, 503);
  assert.equal(response.body.status, "not_ready");
  assert.equal(response.body.database, "unavailable");
});

test("GET /api/health/ready verifies the PostgreSQL connection", {
  skip: !process.env.DATABASE_URL
}, async () => {
  const response = await request(app).get("/api/health/ready");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.database, "ok");
});

test("unknown API routes return a stable JSON error", async () => {
  const response = await request(app).get("/api/does-not-exist");

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});

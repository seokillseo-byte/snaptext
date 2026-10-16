import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { AuthRateLimiter } from "./middleware/authRateLimit.js";

function fakeRequest(ip: string, path = "/login"): Request {
  return { ip, path } as Request;
}

function fakeResponse() {
  const state: { statusCode?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    }
  } as unknown as Response;
  return { response, state };
}

function run(limiter: AuthRateLimiter, ip: string, path = "/login") {
  let nextCalled = false;
  const { response, state } = fakeResponse();
  limiter.middleware(fakeRequest(ip, path), response, (() => {
    nextCalled = true;
  }) as NextFunction);
  return { nextCalled, ...state };
}

test("auth rate limiter blocks attempts after the configured threshold", () => {
  const limiter = new AuthRateLimiter(1_000, 2, 20, 100, () => 100);
  assert.equal(run(limiter, "192.0.2.1").nextCalled, true);
  assert.equal(run(limiter, "192.0.2.1").nextCalled, true);
  const blocked = run(limiter, "192.0.2.1");
  assert.equal(blocked.statusCode, 429);
  assert.equal((blocked.body as { error: { code: string } }).error.code, "RATE_LIMITED");
});

test("expired entries are pruned on the configured sweep interval", () => {
  let now = 0;
  const limiter = new AuthRateLimiter(10, 2, 20, 2, () => now);
  run(limiter, "192.0.2.1");
  assert.equal(limiter.size, 1);
  now = 11;
  run(limiter, "192.0.2.2");
  run(limiter, "192.0.2.3");
  assert.equal(limiter.size, 2);
});

test("entry count is capped when clients use many distinct IPs", () => {
  const limiter = new AuthRateLimiter(10_000, 2, 2, 100, () => 0);
  run(limiter, "192.0.2.1");
  run(limiter, "192.0.2.2");
  run(limiter, "192.0.2.3");
  assert.equal(limiter.size, 2);
});

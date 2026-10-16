import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { requireSameOrigin } from "./middleware/authentication.js";

function run(options: {
  method?: string;
  origin?: string;
  host?: string;
  protocol?: string;
  cookie?: string;
}) {
  const request = {
    method: options.method ?? "POST",
    protocol: options.protocol ?? "https",
    headers: { cookie: options.cookie },
    get(name: string) {
      if (name.toLowerCase() === "origin") return options.origin;
      if (name.toLowerCase() === "host") return options.host ?? "app.example.test";
      return undefined;
    }
  } as unknown as Request;
  const state: { statusCode?: number; body?: unknown; nextCalled: boolean } = { nextCalled: false };
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
  requireSameOrigin(request, response, (() => {
    state.nextCalled = true;
  }) as NextFunction);
  return state;
}

test("allows a same-origin state-changing request with a session cookie", () => {
  assert.equal(run({
    origin: "https://app.example.test",
    cookie: "snaptext_session=abc"
  }).nextCalled, true);
});

test("rejects a cookie-authenticated state change when Origin is missing", () => {
  const result = run({ cookie: "snaptext_session=abc" });
  assert.equal(result.statusCode, 403);
  assert.equal((result.body as { error: { code: string } }).error.code, "ORIGIN_REQUIRED");
});

test("rejects a cross-origin state change even when URL has a matching host suffix", () => {
  const result = run({
    origin: "https://app.example.test.attacker.invalid",
    cookie: "snaptext_session=abc"
  });
  assert.equal(result.statusCode, 403);
  assert.equal((result.body as { error: { code: string } }).error.code, "CROSS_ORIGIN_REQUEST");
});

test("rejects malformed Origin values", () => {
  const result = run({ origin: "not a URL", cookie: "snaptext_session=abc" });
  assert.equal(result.statusCode, 403);
});

test("keeps GET requests exempt from the state-change Origin check", () => {
  assert.equal(run({ method: "GET", cookie: "snaptext_session=abc" }).nextCalled, true);
});

test("keeps non-cookie API clients compatible when Origin is omitted", () => {
  assert.equal(run({}).nextCalled, true);
});

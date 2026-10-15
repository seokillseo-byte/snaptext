import assert from "node:assert/strict";
import { test } from "node:test";
import { ResendEmailSender } from "./emailDelivery.js";

test("Resend sender sends transactional email using server-side credentials", async () => {
  let capturedUrl: RequestInfo | URL | undefined;
  let capturedInit: RequestInit | undefined;
  const sender = new ResendEmailSender(
    "re_test_secret_only_on_server",
    "SnapText <no-reply@example.com>",
    async (input, init) => {
      capturedUrl = input;
      capturedInit = init;
      return new Response(JSON.stringify({ id: "email_test_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  );

  await sender.send({
    to: "customer@example.com",
    subject: "Verify your SnapText account",
    text: "Your one-time verification token is test-token."
  });

  assert.equal(String(capturedUrl), "https://api.resend.com/emails");
  assert.equal(capturedInit?.method, "POST");
  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get("authorization"), "Bearer re_test_secret_only_on_server");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
    from: "SnapText <no-reply@example.com>",
    to: ["customer@example.com"],
    subject: "Verify your SnapText account",
    text: "Your one-time verification token is test-token."
  });
  assert.ok(capturedInit?.signal);
});

test("Resend sender hides provider error details and credentials", async () => {
  const secret = "re_do_not_leak_this_secret";
  const sender = new ResendEmailSender(
    secret,
    "SnapText <no-reply@example.com>",
    async () => new Response(JSON.stringify({
      message: `Invalid key: ${secret}`,
      name: "authentication_error"
    }), { status: 401, headers: { "Content-Type": "application/json" } })
  );

  await assert.rejects(
    sender.send({ to: "customer@example.com", subject: "Reset password", text: "token" }),
    (error: unknown) => {
      assert.equal((error as { code?: string }).code, "EMAIL_DELIVERY_FAILED");
      assert.equal((error as Error).message, "Email delivery is unavailable.");
      assert.equal((error as Error).message.includes(secret), false);
      return true;
    }
  );
});

test("Resend sender maps network errors to a safe generic error", async () => {
  const sender = new ResendEmailSender(
    "re_private_key",
    "SnapText <no-reply@example.com>",
    async () => { throw new Error("network failure containing re_private_key"); }
  );

  await assert.rejects(
    sender.send({ to: "customer@example.com", subject: "Verify", text: "token" }),
    (error: unknown) => {
      assert.equal((error as { code?: string }).code, "EMAIL_DELIVERY_FAILED");
      assert.equal((error as Error).message, "Email delivery is unavailable.");
      assert.equal((error as Error).message.includes("re_private_key"), false);
      return true;
    }
  );
});

test("Resend sender refuses empty credentials or sender identity", () => {
  assert.throws(() => new ResendEmailSender("", "SnapText <no-reply@example.com>"));
  assert.throws(() => new ResendEmailSender("re_test_key", " "));
});

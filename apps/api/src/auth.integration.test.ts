import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import request from "supertest";
import { app } from "./app.js";
import { closePool, getPool } from "./db/pool.js";
import { setEmailSenderForTests, type OutboundEmail } from "./services/emailDelivery.js";
import { createTestSession } from "./testing/testSession.js";

const databaseAvailable = Boolean(process.env.DATABASE_URL);

after(async () => {
  await closePool();
});

test("self-service registration requires verification and supports session login/logout", {
  skip: !databaseAvailable
}, async () => {
  const pool = getPool();
  const sent: OutboundEmail[] = [];
  const restoreSender = setEmailSenderForTests({ send: async (message) => { sent.push(message); } });
  let userId: string | undefined;
  try {
    const email = `signup-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
    const registration = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "long-test-password-123", workspaceName: "Test customer workspace" });
    assert.equal(registration.status, 201);
    userId = registration.body.data.userId;
    assert.equal("token" in registration.body, false);
    assert.equal(JSON.stringify(registration.body).includes("verification token"), false);
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /one-time verification token/);
    const token = sent[0].text.match(/token[^:]*: ([A-Za-z0-9_-]+)/i)?.[1];
    assert.ok(token);

    const expiredVerificationToken = "expired-verification-token-for-test";
    await pool.query(
      "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() - interval '1 minute')",
      [userId, createHash("sha256").update(expiredVerificationToken).digest("hex")]
    );
    const expiredVerification = await request(app).post("/api/auth/verify-email").send({ token: expiredVerificationToken });
    assert.equal(expiredVerification.status, 400);
    assert.equal(expiredVerification.body.error.code, "INVALID_VERIFICATION_TOKEN");

    const unverifiedLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "long-test-password-123" });
    assert.equal(unverifiedLogin.status, 401);

    const verification = await request(app).post("/api/auth/verify-email").send({ token });
    assert.equal(verification.status, 200);
    const replay = await request(app).post("/api/auth/verify-email").send({ token });
    assert.equal(replay.status, 400);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "long-test-password-123" });
    assert.equal(login.status, 200);
    const setCookieHeader = login.headers["set-cookie"];
    assert.ok(setCookieHeader);
    const setCookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    assert.ok(setCookie.startsWith("snaptext_session="));
    const cookie = setCookie.split(";")[0];

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    const workspaces = await request(app).get("/api/workspaces").set("Cookie", cookie);
    assert.equal(workspaces.status, 200);
    assert.equal(workspaces.body.data.items.length, 1);
    assert.equal(workspaces.body.data.items[0].name, "Test customer workspace");

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    assert.equal(logout.status, 204);
    const afterLogout = await request(app).get("/api/auth/me").set("Cookie", cookie);
    assert.equal(afterLogout.status, 401);

    const resetRequest = await request(app).post("/api/auth/password-reset/request").send({ email });
    assert.equal(resetRequest.status, 202);
    assert.equal(sent.length, 2);
    const resetToken = sent[1].text.match(/token: ([A-Za-z0-9_-]+)/i)?.[1];
    assert.ok(resetToken);
    const expiredResetToken = "expired-password-reset-token-for-test";
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() - interval '1 minute')",
      [userId, createHash("sha256").update(expiredResetToken).digest("hex")]
    );
    const expiredReset = await request(app).post("/api/auth/password-reset/confirm")
      .send({ token: expiredResetToken, password: "expired-reset-password-999" });
    assert.equal(expiredReset.status, 400);
    assert.equal(expiredReset.body.error.code, "INVALID_RESET_TOKEN");

    const reset = await request(app).post("/api/auth/password-reset/confirm")
      .send({ token: resetToken, password: "new-long-test-password-456" });
    assert.equal(reset.status, 200);
    const replayReset = await request(app).post("/api/auth/password-reset/confirm")
      .send({ token: resetToken, password: "another-long-password-789" });
    assert.equal(replayReset.status, 400);
    const oldPasswordLogin = await request(app).post("/api/auth/login")
      .send({ email, password: "long-test-password-123" });
    assert.equal(oldPasswordLogin.status, 401);
    const newPasswordLogin = await request(app).post("/api/auth/login")
      .send({ email, password: "new-long-test-password-456" });
    assert.equal(newPasswordLogin.status, 200);
    const newSetCookieHeader = newPasswordLogin.headers["set-cookie"];
    assert.ok(newSetCookieHeader);
    const newSetCookie = Array.isArray(newSetCookieHeader) ? newSetCookieHeader[0] : newSetCookieHeader;
    const newCookie = newSetCookie.split(";")[0];
    const currentUser = await request(app).get("/api/auth/me").set("Cookie", newCookie);
    assert.equal(currentUser.status, 200);
  } finally {
    if (userId) {
      await pool.query("DELETE FROM workspaces WHERE id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = $1)", [userId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
    restoreSender();
  }
});

test("workspace APIs deny cross-tenant reads and writes", {
  skip: !databaseAvailable
}, async () => {
  const pool = getPool();
  const userA = await createTestSession(pool);
  const userB = await createTestSession(pool);
  let workspaceA: string | undefined;
  let workspaceB: string | undefined;
  try {
    const createA = await request(app).post("/api/workspaces")
      .set("Cookie", userA.cookie).send({ name: "Tenant A" });
    assert.equal(createA.status, 201);
    workspaceA = createA.body.data.id;

    const createB = await request(app).post("/api/workspaces")
      .set("Cookie", userB.cookie).send({ name: "Tenant B" });
    assert.equal(createB.status, 201);
    workspaceB = createB.body.data.id;

    const readBAsA = await request(app).get(`/api/workspaces/${workspaceB}`).set("Cookie", userA.cookie);
    assert.equal(readBAsA.status, 404);

    const createBatchInBAsA = await request(app)
      .post(`/api/workspaces/${workspaceB}/batches`)
      .set("Cookie", userA.cookie).send({ name: "Unauthorized batch" });
    assert.equal(createBatchInBAsA.status, 404);

    const listAsA = await request(app).get("/api/workspaces").set("Cookie", userA.cookie);
    assert.equal(listAsA.status, 200);
    assert.deepEqual(listAsA.body.data.items.map((item: { id: string }) => item.id), [workspaceA]);

    const expiredToken = "expired-session-token-for-test";
    const { createHash } = await import("node:crypto");
    await pool.query(
      "INSERT INTO auth_sessions (user_id, token_hash, created_at, expires_at) VALUES ($1, $2, now() - interval '2 hours', now() - interval '1 hour')",
      [userA.userId, createHash("sha256").update(expiredToken).digest("hex")]
    );
    const expiredSession = await request(app).get("/api/auth/me").set("Cookie", `snaptext_session=${expiredToken}`);
    assert.equal(expiredSession.status, 401);
  } finally {
    if (workspaceA) await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceA]);
    if (workspaceB) await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceB]);
    await userA.cleanup();
    await userB.cleanup();
  }
});

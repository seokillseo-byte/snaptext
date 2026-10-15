import assert from "node:assert/strict";
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
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /one-time verification token/);
    const token = sent[0].text.match(/token[^:]*: ([A-Za-z0-9_-]+)/i)?.[1];
    assert.ok(token);

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
    const setCookie = login.headers["set-cookie"] as string[];
    assert.ok(setCookie?.[0]?.startsWith("snaptext_session="));
    const cookie = setCookie[0].split(";")[0];

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
    const newCookie = (newPasswordLogin.headers["set-cookie"] as string[])[0].split(";")[0];
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

    await pool.query("UPDATE auth_sessions SET expires_at = now() - interval '1 minute' WHERE user_id = $1", [userA.userId]);
    const expiredSession = await request(app).get("/api/auth/me").set("Cookie", userA.cookie);
    assert.equal(expiredSession.status, 401);

    const listAsA = await request(app).get("/api/workspaces").set("Cookie", userA.cookie);
    assert.equal(listAsA.status, 200);
    assert.deepEqual(listAsA.body.data.items.map((item: { id: string }) => item.id), [workspaceA]);
  } finally {
    if (workspaceA) await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceA]);
    if (workspaceB) await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceB]);
    await userA.cleanup();
    await userB.cleanup();
  }
});

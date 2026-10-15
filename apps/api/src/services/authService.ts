import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Pool } from "pg";
import { getEmailSender } from "./emailDelivery.js";

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const VERIFY_TTL_MS = 1000 * 60 * 60 * 24;
const RESET_TTL_MS = 1000 * 60 * 30;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !/^[0-9a-f]{128}$/i.test(expectedHex ?? "")) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function normalizeEmail(value: unknown): { email: string; normalized: string } {
  if (typeof value !== "string") throw Object.assign(new Error("A valid email address is required."), { statusCode: 400, code: "INVALID_EMAIL" });
  const email = value.trim();
  const normalized = email.toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw Object.assign(new Error("A valid email address is required."), { statusCode: 400, code: "INVALID_EMAIL" });
  }
  return { email, normalized };
}

function validatePassword(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    throw Object.assign(new Error("Password must contain between 12 and 128 characters."), { statusCode: 400, code: "INVALID_PASSWORD" });
  }
}

async function audit(pool: Pool, userId: string | null, event: string, outcome: "SUCCESS" | "DENIED" | "FAILURE"): Promise<void> {
  await pool.query(
    "INSERT INTO auth_audit_events (user_id, event_type, outcome) VALUES ($1, $2, $3)",
    [userId, event, outcome]
  );
}

export class AuthService {
  constructor(private readonly pool: Pool) {}

  async register(input: { email: unknown; password: unknown; workspaceName?: unknown }): Promise<{ userId: string; verificationRequired: true }> {
    const { email, normalized } = normalizeEmail(input.email);
    validatePassword(input.password);
    const workspaceName = typeof input.workspaceName === "string" ? input.workspaceName.trim() : "My workspace";
    if (workspaceName.length < 1 || workspaceName.length > 160) {
      throw Object.assign(new Error("Workspace name must be between 1 and 160 characters."), { statusCode: 400, code: "INVALID_WORKSPACE_NAME" });
    }

    const token = newSecret();
    const passwordHash = await hashPassword(input.password);
    const client = await this.pool.connect();
    let userId: string;
    try {
      await client.query("BEGIN");
      const user = await client.query<{ id: string }>(
        "INSERT INTO users (email, email_normalized, password_hash) VALUES ($1, $2, $3) RETURNING id",
        [email, normalized, passwordHash]
      );
      userId = user.rows[0].id;
      const workspace = await client.query<{ id: string }>(
        "INSERT INTO workspaces (name) VALUES ($1) RETURNING id",
        [workspaceName]
      );
      await client.query(
        "INSERT INTO workspace_memberships (workspace_id, user_id, role) VALUES ($1, $2, 'OWNER')",
        [workspace.rows[0].id, userId]
      );
      await client.query(
        "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [userId, sha256(token), new Date(Date.now() + VERIFY_TTL_MS)]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const candidate = error as { code?: string };
      if (candidate.code === "23505") {
        throw Object.assign(new Error("An account with this email already exists."), { statusCode: 409, code: "EMAIL_ALREADY_REGISTERED" });
      }
      throw error;
    } finally {
      client.release();
    }

    try {
      await getEmailSender().send({
        to: email,
        subject: "Verify your SnapText account",
        text: `Use this one-time verification token to verify your SnapText account: ${token}\nThis token expires in 24 hours.`
      });
    } catch (error) {
      await this.pool.query("DELETE FROM users WHERE id = $1 AND email_verified_at IS NULL", [userId!]).catch(() => undefined);
      throw error;
    }
    await audit(this.pool, userId!, "REGISTER", "SUCCESS");
    return { userId: userId!, verificationRequired: true };
  }

  async verifyEmail(tokenInput: unknown): Promise<void> {
    if (typeof tokenInput !== "string" || tokenInput.length < 20 || tokenInput.length > 200) {
      throw Object.assign(new Error("Verification token is invalid or expired."), { statusCode: 400, code: "INVALID_VERIFICATION_TOKEN" });
    }
    const result = await this.pool.query<{ user_id: string }>(
      `UPDATE email_verification_tokens SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [sha256(tokenInput)]
    );
    if (result.rowCount !== 1) {
      throw Object.assign(new Error("Verification token is invalid or expired."), { statusCode: 400, code: "INVALID_VERIFICATION_TOKEN" });
    }
    await this.pool.query("UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1", [result.rows[0].user_id]);
    await audit(this.pool, result.rows[0].user_id, "VERIFY_EMAIL", "SUCCESS");
  }

  async login(input: { email: unknown; password: unknown }): Promise<{ user: { id: string; email: string }; sessionToken: string; expiresAt: Date }> {
    const { normalized } = normalizeEmail(input.email);
    if (typeof input.password !== "string" || input.password.length > 128) {
      throw Object.assign(new Error("Invalid email or password."), { statusCode: 401, code: "INVALID_CREDENTIALS" });
    }
    const result = await this.pool.query<{ id: string; email: string; password_hash: string; email_verified_at: Date | null }>(
      "SELECT id, email, password_hash, email_verified_at FROM users WHERE email_normalized = $1",
      [normalized]
    );
    const row = result.rows[0];
    const valid = row ? await verifyPassword(input.password, row.password_hash) : false;
    if (!row || !valid || !row.email_verified_at) {
      await audit(this.pool, row?.id ?? null, "LOGIN", "DENIED");
      throw Object.assign(new Error("Invalid email, password, or unverified account."), { statusCode: 401, code: "INVALID_CREDENTIALS" });
    }
    const sessionToken = newSecret();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.pool.query(
      "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [row.id, sha256(sessionToken), expiresAt]
    );
    await audit(this.pool, row.id, "LOGIN", "SUCCESS");
    return { user: { id: row.id, email: row.email }, sessionToken, expiresAt };
  }

  async logout(sessionId: string): Promise<void> {
    await this.pool.query("UPDATE auth_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL", [sessionId]);
  }

  async requestPasswordReset(emailInput: unknown): Promise<void> {
    const { normalized } = normalizeEmail(emailInput);
    const result = await this.pool.query<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE email_normalized = $1 AND email_verified_at IS NOT NULL",
      [normalized]
    );
    if (!result.rowCount) return;
    const user = result.rows[0];
    const token = newSecret();
    await this.pool.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [
      user.id, sha256(token), new Date(Date.now() + RESET_TTL_MS)
    ]);
    try {
      await getEmailSender().send({
        to: user.email,
        subject: "Reset your SnapText password",
        text: `Use this one-time password reset token: ${token}\nThis token expires in 30 minutes.`
      });
    } catch (error) {
      await this.pool.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [sha256(token)]);
      throw error;
    }
  }

  async resetPassword(tokenInput: unknown, passwordInput: unknown): Promise<void> {
    if (typeof tokenInput !== "string" || tokenInput.length < 20 || tokenInput.length > 200) {
      throw Object.assign(new Error("Reset token is invalid or expired."), { statusCode: 400, code: "INVALID_RESET_TOKEN" });
    }
    validatePassword(passwordInput);
    const passwordHash = await hashPassword(passwordInput);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE",
        [sha256(tokenInput)]
      );
      if (found.rowCount !== 1) throw Object.assign(new Error("Reset token is invalid or expired."), { statusCode: 400, code: "INVALID_RESET_TOKEN" });
      const token = found.rows[0];
      await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [token.id]);
      await client.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [passwordHash, token.user_id]);
      await client.query("UPDATE auth_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [token.user_id]);
      await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL", [token.user_id]);
      await client.query("COMMIT");
      await audit(this.pool, token.user_id, "PASSWORD_RESET", "SUCCESS");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}

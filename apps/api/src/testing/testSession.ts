import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";

export async function createTestSession(pool: Pool): Promise<{ userId: string; cookie: string; cleanup: () => Promise<void> }> {
  const token = randomBytes(32).toString("base64url");
  const email = `test-${randomBytes(12).toString("hex")}@example.test`;
  const user = await pool.query<{ id: string }>(
    "INSERT INTO users (email, email_normalized, password_hash, email_verified_at) VALUES ($1, $2, $3, now()) RETURNING id",
    [email, email.toLowerCase(), "test-only-not-a-password-hash"]
  );
  const userId = user.rows[0].id;
  await pool.query(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, createHash("sha256").update(token).digest("hex"), new Date(Date.now() + 60 * 60 * 1000)]
  );
  return {
    userId,
    cookie: `snaptext_session=${token}`,
    cleanup: async () => {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
  };
}

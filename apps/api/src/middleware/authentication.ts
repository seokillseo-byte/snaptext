import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getPool } from "../db/pool.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string };
      authSessionId?: string;
    }
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}

export async function requireAuthentication(request: Request, response: Response, next: NextFunction): Promise<void> {
  const token = cookieValue(request.headers.cookie, "snaptext_session");
  if (!token || token.length > 200) {
    response.status(401).json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Please sign in to continue." } });
    return;
  }
  try {
    const result = await getPool().query<{ session_id: string; id: string; email: string }>(
      `SELECT s.id AS session_id, u.id, u.email
       FROM auth_sessions s INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
         AND u.email_verified_at IS NOT NULL`,
      [hashToken(token)]
    );
    if (result.rowCount !== 1) {
      response.status(401).json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Please sign in to continue." } });
      return;
    }
    request.authUser = { id: result.rows[0].id, email: result.rows[0].email };
    request.authSessionId = result.rows[0].session_id;
    void getPool().query("UPDATE auth_sessions SET last_seen_at = now() WHERE id = $1", [result.rows[0].session_id]).catch(() => undefined);
    next();
  } catch {
    response.status(503).json({ error: { code: "AUTHENTICATION_UNAVAILABLE", message: "Authentication is temporarily unavailable." } });
  }
}

export function requireSameOrigin(request: Request, response: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  const origin = request.get("origin");
  const cookieHeader = request.headers.cookie ?? "";
  const hasSessionCookie = cookieHeader.split(";").some((part) => part.trim().startsWith("snaptext_session="));
  // Browsers attach cookies automatically. For cookie-authenticated state changes,
  // require an Origin header so a cross-site form cannot bypass the origin check.
  // Requests without a session cookie retain compatibility with non-browser API clients.
  if (!origin) {
    if (hasSessionCookie) {
      response.status(403).json({ error: { code: "ORIGIN_REQUIRED", message: "An Origin header is required for cookie-authenticated state changes." } });
      return;
    }
    next();
    return;
  }
  const host = request.get("host");
  const expected = host ? `${request.protocol}://${host}` : "";
  let suppliedOrigin: string;
  let expectedOrigin: string;
  try {
    suppliedOrigin = new URL(origin).origin;
    expectedOrigin = new URL(expected).origin;
  } catch {
    response.status(403).json({ error: { code: "CROSS_ORIGIN_REQUEST", message: "Cross-origin state changes are not allowed." } });
    return;
  }
  if (!expected || suppliedOrigin !== expectedOrigin) {
    response.status(403).json({ error: { code: "CROSS_ORIGIN_REQUEST", message: "Cross-origin state changes are not allowed." } });
    return;
  }
  next();
}

export async function requireWorkspaceMembership(request: Request, response: Response, next: NextFunction): Promise<void> {
  const workspaceIdValue = request.params.workspaceId;
  const workspaceId = Array.isArray(workspaceIdValue) ? workspaceIdValue[0] : workspaceIdValue;
  const userId = request.authUser?.id;
  if (!workspaceId || !userId) {
    response.status(401).json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Please sign in to continue." } });
    return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceId)) {
    response.status(404).json({ error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace was not found." } });
    return;
  }
  try {
    const result = await getPool().query(
      "SELECT 1 FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, userId]
    );
    if (result.rowCount !== 1) {
      response.status(404).json({ error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace was not found." } });
      return;
    }
    next();
  } catch {
    response.status(503).json({ error: { code: "AUTHORIZATION_UNAVAILABLE", message: "Authorization is temporarily unavailable." } });
  }
}

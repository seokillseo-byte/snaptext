import { Router } from "express";
import { getPool } from "../db/pool.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { AuthService } from "../services/authService.js";

export const authRouter = Router();
const service = () => new AuthService(getPool());
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; expiresAt: number }>();

function rateLimit(request: import("express").Request, response: import("express").Response, next: import("express").NextFunction): void {
  const key = `${request.ip}:${request.path}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.expiresAt <= now) {
    attempts.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    next();
    return;
  }
  current.count += 1;
  if (current.count > MAX_ATTEMPTS) {
    response.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." } });
    return;
  }
  next();
}

function sessionCookie(token: string, expiresAt: Date): string {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `snaptext_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `snaptext_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function routeError(error: unknown, response: import("express").Response): void {
  const candidate = error as { statusCode?: number; code?: string; message?: string };
  const status = candidate.statusCode ?? 500;
  response.status(status).json({
    error: {
      code: candidate.code ?? "INTERNAL_ERROR",
      message: status >= 500 ? "The request could not be completed." : candidate.message ?? "The request is invalid."
    }
  });
}

authRouter.post("/register", rateLimit, async (request, response) => {
  try {
    const result = await service().register({
      email: request.body?.email,
      password: request.body?.password,
      workspaceName: request.body?.workspaceName
    });
    response.status(201).json({ data: result, message: "Check your email to verify your account before signing in." });
  } catch (error) {
    routeError(error, response);
  }
});

authRouter.post("/verify-email", rateLimit, async (request, response) => {
  try {
    await service().verifyEmail(request.body?.token);
    response.status(200).json({ data: { verified: true } });
  } catch (error) {
    routeError(error, response);
  }
});

authRouter.post("/login", rateLimit, async (request, response) => {
  try {
    const result = await service().login({ email: request.body?.email, password: request.body?.password });
    response.setHeader("Set-Cookie", sessionCookie(result.sessionToken, result.expiresAt));
    response.status(200).json({ data: { user: result.user, expiresAt: result.expiresAt.toISOString() } });
  } catch (error) {
    routeError(error, response);
  }
});

authRouter.post("/logout", requireAuthentication, async (request, response) => {
  try {
    if (request.authSessionId) await service().logout(request.authSessionId);
    response.setHeader("Set-Cookie", clearSessionCookie());
    response.status(204).end();
  } catch (error) {
    routeError(error, response);
  }
});

authRouter.get("/me", requireAuthentication, (_request, response) => {
  response.status(200).json({ data: { user: _request.authUser } });
});

authRouter.post("/password-reset/request", rateLimit, async (request, response) => {
  try {
    await service().requestPasswordReset(request.body?.email);
    response.status(202).json({ message: "If the account exists, password reset instructions will be sent." });
  } catch (error) {
    routeError(error, response);
  }
});

authRouter.post("/password-reset/confirm", rateLimit, async (request, response) => {
  try {
    await service().resetPassword(request.body?.token, request.body?.password);
    response.status(200).json({ data: { passwordReset: true } });
  } catch (error) {
    routeError(error, response);
  }
});

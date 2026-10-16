import type { NextFunction, Request, Response } from "express";

export interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

/**
 * Process-local rate limiter for low-volume authentication endpoints.
 * Expired entries are swept periodically, and the map has a hard size cap
 * so arbitrary client IPs cannot grow it without bound. This is not a
 * distributed limiter; production multi-instance deployments need shared storage.
 */
export class AuthRateLimiter {
  private readonly attempts = new Map<string, RateLimitEntry>();
  private requestsSinceSweep = 0;

  constructor(
    private readonly windowMs = 15 * 60 * 1000,
    private readonly maxAttempts = 10,
    private readonly maxEntries = 10_000,
    private readonly sweepEvery = 100,
    private readonly now: () => number = Date.now
  ) {}

  middleware(request: Request, response: Response, next: NextFunction): void {
    const key = `${request.ip}:${request.path}`;
    const now = this.now();

    this.requestsSinceSweep += 1;
    if (this.requestsSinceSweep >= this.sweepEvery) {
      this.pruneExpired(now);
      this.requestsSinceSweep = 0;
    }

    const current = this.attempts.get(key);
    if (!current || current.expiresAt <= now) {
      if (!current && this.attempts.size >= this.maxEntries) {
        // Evict the oldest entry to keep memory bounded. This is a safety cap,
        // not a substitute for a shared production rate-limit store.
        const oldestKey = this.attempts.keys().next().value;
        if (oldestKey !== undefined) this.attempts.delete(oldestKey);
      }
      this.attempts.set(key, { count: 1, expiresAt: now + this.windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > this.maxAttempts) {
      response.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please try again later."
        }
      });
      return;
    }
    next();
  }

  private pruneExpired(now: number): void {
    for (const [key, entry] of this.attempts) {
      if (entry.expiresAt <= now) this.attempts.delete(key);
    }
  }

  /** Exposed for deterministic unit tests and diagnostics; do not return keys. */
  get size(): number {
    return this.attempts.size;
  }
}

const authRateLimiter = new AuthRateLimiter();

export function authRateLimit(request: Request, response: Response, next: NextFunction): void {
  authRateLimiter.middleware(request, response, next);
}

// ============================================================================
// PropPilot — In-memory Rate Limiter
// ============================================================================
// A lightweight sliding-window limiter to guard expensive endpoints (e.g. AI
// generation). For multi-region/serverless scale, swap the Map-backed store
// for Upstash Redis or Supabase — the public API stays identical.
// ============================================================================

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically clear expired buckets to avoid unbounded growth.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks and records a hit for `identifier`.
 * @param identifier Unique key (e.g. `ai:<userId>`).
 * @param limit Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(identifier);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

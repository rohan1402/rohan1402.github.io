import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for the chat route.
 *
 * Two layers:
 * - per-IP sliding window: 8 messages/minute and 40/day.
 * - a global fixed daily cap of 300 model calls (to bound API spend).
 *
 * Upstash Redis is REQUIRED to enforce the global cap. On Vercel serverless,
 * in-memory state is per-instance and wiped on cold start, so an in-memory
 * limiter cannot bound a global daily total. Therefore:
 * - Upstash configured: real distributed limits.
 * - Upstash missing in production: FAIL CLOSED (deny, serve scripted). This
 *   keeps spend bounded even if someone forgets to set the env vars.
 * - Upstash missing in local dev: a best-effort in-memory limiter, purely so
 *   local testing behaves, never relied on for a real guarantee.
 */

export type RateLimitResult = { ok: boolean; reason?: string };

const MINUTE = 60_000;
const DAY = 86_400_000;

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

type Limiter = { limit: (id: string) => Promise<{ success: boolean }> };

let ipMinute: Limiter | null = null;
let ipDay: Limiter | null = null;
let globalDay: Limiter | null = null;

if (hasUpstash) {
  const redis = Redis.fromEnv();
  ipMinute = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "1 m"),
    prefix: "ar:ipmin",
  });
  ipDay = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(40, "1 d"),
    prefix: "ar:ipday",
  });
  globalDay = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(300, "1 d"),
    prefix: "ar:global",
  });
}

// Best-effort per-instance limiter for LOCAL DEV ONLY.
const memBuckets = new Map<string, number[]>();
function memAllow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (memBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    memBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  memBuckets.set(key, hits);
  return true;
}

/**
 * Returns { ok: true } if this request may call the model. Per-IP limits are
 * checked before the global counter so a throttled IP does not burn the global
 * budget.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  if (hasUpstash) {
    const minute = await ipMinute!.limit(ip);
    if (!minute.success) return { ok: false, reason: "ip-minute" };
    const day = await ipDay!.limit(ip);
    if (!day.success) return { ok: false, reason: "ip-day" };
    const global = await globalDay!.limit("global");
    if (!global.success) return { ok: false, reason: "global-cap" };
    return { ok: true };
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "Rate limiter: Upstash env vars missing in production. Failing closed to scripted mode. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable the live model."
    );
    return { ok: false, reason: "no-limiter" };
  }

  // Local dev best-effort (per-instance, not a real guarantee).
  if (!memAllow(`ipmin:${ip}`, 8, MINUTE)) return { ok: false, reason: "ip-minute" };
  if (!memAllow(`ipday:${ip}`, 40, DAY)) return { ok: false, reason: "ip-day" };
  if (!memAllow("global", 300, DAY)) return { ok: false, reason: "global-cap" };
  return { ok: true };
}

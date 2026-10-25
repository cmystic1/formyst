type Entry = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as { rateLimitBuckets?: Map<string, Entry> };

const buckets: Map<string, Entry> =
  globalForLimiter.rateLimitBuckets ?? new Map<string, Entry>();
globalForLimiter.rateLimitBuckets = buckets;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number; remaining: number };

/**
 * Simple in-memory fixed-window rate limiter. Suitable for a single self-hosted
 * instance; use a shared store (e.g. Redis) if you run multiple replicas.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [bucketKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(bucketKey);
    }
    while (buckets.size > 5000) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    ok: entry.count <= limit,
    retryAfterSeconds,
    remaining: Math.max(0, limit - entry.count),
  };
}

export function getClientIp(request: Request): string {
  if (process.env.TRUST_PROXY !== "true") return "untrusted";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

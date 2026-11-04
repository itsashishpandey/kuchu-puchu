// Simple in-memory rate limiter (per process) for sensitive endpoints
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

// the real visitor address (never the client-written first X-Forwarded-For entry)
export { clientIp } from "@/lib/client-ip";

// server/utils/rateLimit.ts
// Einfaches In-Memory-Limit pro Schlüssel (IP). Reicht für eine Instanz; bei mehreren Instanzen später Redis.
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (list.length >= limit) { hits.set(key, list); return false }
      list.push(now)
      hits.set(key, list)
      return true
    },
  }
}

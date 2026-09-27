// Simple, robust in-memory sliding window rate limiter
interface RateLimitOptions {
  interval: number; // in milliseconds (e.g. 60000 for 1 minute)
}

export function createRateLimiter(options: RateLimitOptions) {
  const tokenCache = new Map<string, number[]>();
  let lastCleanup = Date.now();

  return {
    check: (limit: number, token: string): { success: boolean; remaining: number; reset: number } => {
      const now = Date.now();

      // Periodic cleanup every 60 seconds
      if (now - lastCleanup > 60000) {
        lastCleanup = now;
        tokenCache.forEach((timestamps, key) => {
          const valid = timestamps.filter((time: number) => now - time < options.interval);
          if (valid.length === 0) {
            tokenCache.delete(key);
          } else {
            tokenCache.set(key, valid);
          }
        });
      }

      const userTimestamps = tokenCache.get(token) || [];
      const recentTimestamps = userTimestamps.filter((time: number) => now - time < options.interval);

      if (recentTimestamps.length >= limit) {
        return {
          success: false,
          remaining: 0,
          reset: Math.max(1, Math.ceil((recentTimestamps[0] + options.interval - now) / 1000)),
        };
      }

      recentTimestamps.push(now);
      tokenCache.set(token, recentTimestamps);

      return {
        success: true,
        remaining: limit - recentTimestamps.length,
        reset: Math.max(1, Math.ceil(options.interval / 1000)),
      };
    },
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }
  return "127.0.0.1";
}

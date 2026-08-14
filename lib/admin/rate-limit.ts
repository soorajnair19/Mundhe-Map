const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };

const attempts = new Map<string, Bucket>();

function getBucket(key: string, now: number): Bucket {
  const existing = attempts.get(key);
  if (!existing || now >= existing.resetAt) {
    const next = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, next);
    return next;
  }
  return existing;
}

export function isLoginLocked(key: string, now = Date.now()): boolean {
  const bucket = attempts.get(key);
  if (!bucket || now >= bucket.resetAt) return false;
  return bucket.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const bucket = getBucket(key, now);
  bucket.count += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

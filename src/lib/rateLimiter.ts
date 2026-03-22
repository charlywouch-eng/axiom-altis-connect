/** Simple client-side rate limiter to prevent form spam */
const attempts = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS: Record<string, number> = {
  signup: 3,
  login: 5,
  payment: 3,
  contact: 3,
  default: 5,
};

export function checkRateLimit(action: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const max = MAX_ATTEMPTS[action] ?? MAX_ATTEMPTS.default;
  const key = action;

  const timestamps = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= max) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    attempts.set(key, timestamps);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return { allowed: true };
}

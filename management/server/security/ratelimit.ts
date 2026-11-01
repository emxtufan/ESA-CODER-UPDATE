/**
 * Rate limiting simplu pe proces: `max` încercări într-o fereastră de `windowMs`.
 * `hit()` → `true` dacă încercarea e permisă, `false` dacă e depășit.
 */

/** Limiter cu fereastră fixă per cheie. */
export type Limiter = {
  hit(key: string): boolean;
  reset(key: string): void;
};

/** Creează un limiter cu cel mult `max` hit-uri într-o fereastră de `windowMs`. */
export function createLimiter(max: number, windowMs: number): Limiter {
  // ponytail: in-memory, un singur proces; Redis dacă apar instanțe multiple
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    hit(key: string): boolean {
      const now = Date.now();

      for (const [existingKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(existingKey);
      }

      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (bucket.count >= max) return false;
      bucket.count += 1;
      return true;
    },

    reset(key: string): void {
      buckets.delete(key);
    },
  };
}

/**
 * Retry helper for Supabase calls that fail because the device couldn't
 * reach the database (dropped wifi, DNS hiccup, cold start, etc.) rather
 * than because the query itself was invalid.
 *
 * Supabase-js resolves network failures into `{ error }` instead of
 * throwing, so callers pass in that error (or throw it) and this module
 * decides whether it's worth retrying.
 */

const NETWORK_ERROR_PATTERN = /network|fetch|timed? ?out|timeout|econnrefused|econnreset|enotfound|failed to fetch/i;

/** True for connection-level failures; false for real Postgres/Postgrest errors (bad input, RLS, conflicts, etc). */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Postgrest/Postgres errors always carry a `code` (e.g. "23505", "42501",
  // "PGRST116"). A real response came back, so retrying won't help.
  if (typeof error === "object" && "code" in error && (error as { code?: unknown }).code) {
    return false;
  }

  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error);
  return NETWORK_ERROR_PATTERN.test(message);
}

export type RetryOptions = {
  /** Number of attempts after the first failure. Default 3. */
  retries?: number;
  /** Base delay in ms before the first retry; doubles each subsequent attempt. Default 500. */
  baseDelayMs?: number;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn`, retrying with exponential backoff + jitter when it fails with
 * a connection-level error. `fn` should throw (or reject) on failure — for
 * Supabase's `{ data, error }` results, throw `error` when it's set.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseDelayMs = 500 } = options;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isRetryableError(error)) {
        throw error;
      }
      const backoff = baseDelayMs * 2 ** attempt;
      const jitter = Math.random() * baseDelayMs;
      await delay(backoff + jitter);
      attempt += 1;
    }
  }
}

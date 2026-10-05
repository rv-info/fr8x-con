/**
 * lib/supabase/retry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Controlled Transient-Failure Retry Logic for FR8X.
 * Only applied to idempotent or read operations to prevent duplicate writes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 300,
  backoffFactor: 2,
  shouldRetry: (error: any) => {
    // Retry on network drops or temporary 503/504 gateway failures
    if (!error) return false;
    const msg = String(error.message || error).toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('fetch failed') ||
      msg.includes('timeout') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('connection reset')
    );
  },
};

/**
 * Executes an operation with exponential backoff for transient network issues.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      const isLastAttempt = attempt === opts.maxRetries;
      if (isLastAttempt || !opts.shouldRetry(err)) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= opts.backoffFactor;
    }
  }

  throw new Error('Retry limit reached');
}

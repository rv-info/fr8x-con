/**
 * lib/observability/logger.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Structured Production Logger & Observability Engine with Automatic PII Redaction
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogPayload {
  level: LogLevel;
  event: string;
  correlationId?: string;
  durationMs?: number;
  userId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class StructuredLogger {
  private piiPatterns = [
    // Email regex
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Phone numbers (e.g. +91 98200 12345 or +1-555-123-4567)
    /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    // Bearer tokens or secret keys
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, // JWT
  ];

  /**
   * Redacts sensitive information from strings and objects.
   */
  public sanitize(input: unknown): unknown {
    if (typeof input === 'string') {
      let result = input;
      for (const pattern of this.piiPatterns) {
        result = result.replace(pattern, '[REDACTED]');
      }
      return result;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (input !== null && typeof input === 'object') {
      const sanitizedObj: Record<string, unknown> = {};
      const sensitiveKeys = new Set([
        'password', 'token', 'secret', 'auth', 'cookie', 'session',
        'email', 'phone', 'mobile', 'raw_query', 'private_message',
      ]);

      for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
        if (sensitiveKeys.has(key.toLowerCase())) {
          sanitizedObj[key] = '[REDACTED]';
        } else {
          sanitizedObj[key] = this.sanitize(val);
        }
      }
      return sanitizedObj;
    }

    return input;
  }

  /**
   * Core logging emitter.
   */
  public log(level: LogLevel, event: string, metadata?: Record<string, unknown>): StructuredLogPayload {
    const payload: StructuredLogPayload = {
      level,
      event,
      timestamp: new Date().toISOString(),
      metadata: this.sanitize(metadata) as Record<string, unknown> | undefined,
    };

    // Format output for development / test / production server logs
    const formatted = `[${payload.timestamp}] [${level.toUpperCase()}] ${event} ${
      payload.metadata ? JSON.stringify(payload.metadata) : ''
    }`;

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else if (process.env.NODE_ENV !== 'test') {
      console.log(formatted);
    }

    return payload;
  }

  public info(event: string, metadata?: Record<string, unknown>): StructuredLogPayload {
    return this.log('info', event, metadata);
  }

  public warn(event: string, metadata?: Record<string, unknown>): StructuredLogPayload {
    return this.log('warn', event, metadata);
  }

  public error(event: string, metadata?: Record<string, unknown>): StructuredLogPayload {
    return this.log('error', event, metadata);
  }

  /**
   * Helper to measure async execution time and log latency.
   */
  public async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      this.info(`${operationName}.success`, { ...metadata, durationMs });
      return result;
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.error(`${operationName}.failure`, { ...metadata, durationMs, error: errorMsg });
      throw err;
    }
  }
}

export const logger = new StructuredLogger();

/**
 * lib/supabase/errors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Application and Database Error Architecture for FR8X.
 * Distinguishes between validation, auth, authorization, not-found,
 * conflict, and internal database errors.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required to perform this action') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to access or modify this resource') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const msg = id ? `${resource} with identifier "${id}" was not found` : `${resource} was not found`;
    super(msg, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'A resource with these unique attributes already exists') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'A database error occurred', details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Maps PostgreSQL and PostgREST error codes to standard typed AppErrors.
 */
export function handleSupabaseError(error: unknown, context?: string): AppError {
  if (!error) return new DatabaseError('Unknown database error occurred');
  if (error instanceof AppError) return error;

  const err = error as { code?: string; message?: string; details?: string; hint?: string };
  const prefix = context ? `[${context}] ` : '';

  // PostgreSQL error codes:
  // 23505 = unique_violation
  if (err.code === '23505') {
    return new ConflictError(`${prefix}A record with this identifier or unique value already exists.`);
  }

  // 23503 = foreign_key_violation
  if (err.code === '23503') {
    return new ValidationError(`${prefix}Referenced parent entity does not exist.`);
  }

  // 42501 = insufficient_privilege (RLS rejection)
  if (err.code === '42501' || err.message?.includes('violates row-level security')) {
    return new AuthorizationError(`${prefix}Action denied by row-level security policy.`);
  }

  // PGRST116 = JSON single row violation (not found)
  if (err.code === 'PGRST116') {
    return new NotFoundError(`${prefix}Requested record`);
  }

  // Fallback safe message (never leak raw SQL or connection string)
  const safeMessage = err.message ? `${prefix}${err.message}` : `${prefix}Database operation failed.`;
  return new DatabaseError(safeMessage, err);
}

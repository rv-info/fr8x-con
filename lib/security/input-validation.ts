/**
 * FR8X Centralized Input Validation & Security Pipeline
 * Strict server-side validation, sanitization, mass assignment defense,
 * SQL injection detection heuristics, and XSS contextual encoding.
 */

import { z } from 'zod';

// =============================================================================
// Contextual Encoding & Sanitization Helpers
// =============================================================================

/**
 * Escapes HTML control characters to prevent reflected or stored XSS.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips script tags, javascript: protocols, and unsafe attributes from user input.
 */
export function sanitizePlainText(input: string, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().slice(0, maxLength);
  // Normalize unicode (NFKC) to defeat homoglyph evasion
  const normalized = trimmed.normalize('NFKC');
  // Strip control characters except newline and tab
  const sanitized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return escapeHtml(sanitized);
}

/**
 * Strips active script vectors, event handlers, and malicious protocols from HTML context.
 */
export function sanitizeHtmlContext(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript:/gi, 'blocked:')
    .replace(/vbscript:/gi, 'blocked:')
    .replace(/data:text\/html/gi, 'blocked:');
  return clean;
}

/**
 * Validates and sanitizes a file path or storage key against path traversal attempts.
 * Throws or returns safe normalized basename.
 */
export function preventPathTraversal(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid path provided');
  }
  // Reject directory traversal attempts and null byte injections
  if (
    filePath.includes('..') ||
    filePath.includes('\0') ||
    filePath.startsWith('/') ||
    filePath.startsWith('\\')
  ) {
    throw new Error('Path traversal sequence detected');
  }
  return filePath.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
}

/**
 * Detects common SQL injection patterns in raw text.
 * Note: Always use parameterized queries in PostgreSQL; this heuristic provides defense-in-depth.
 */
export function detectSqlInjectionPattern(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const sqlKeywords = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|MERGE)\b\s+)/i,
    /(\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
    /(\bAND\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
    /(--|#|\/\*)/,
    /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i,
    /(';|\"|\bWAITFOR\b\s+\bDELAY\b|\bBENCHMARK\b|\bPG_SLEEP\b)/i,
  ];

  return sqlKeywords.some((pattern) => pattern.test(input));
}

/**
 * Protects against Mass Assignment / Parameter Tampering.
 * Strictly extracts only the permitted keys from an incoming request body.
 */
export function pickAllowedFields<T extends object, K extends keyof T>(
  obj: T,
  allowedKeys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// =============================================================================
// Reusable Zod Validation Schemas
// =============================================================================

/**
 * User Search Query Schema
 */
export const UserSearchQuerySchema = z.object({
  q: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .transform((val) => val.trim().normalize('NFKC'))
    .refine((val) => !detectSqlInjectionPattern(val), {
      message: 'Suspicious search parameters detected',
    }),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  role: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;

/**
 * Profile Update Schema (Mass Assignment Protected)
 */
export const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  display_name: z.string().min(1).max(150).optional(),
  designation: z.string().max(120).optional(),
  position: z.string().max(120).optional(),
  department: z.string().max(100).optional(),
  company_name: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  bio: z.string().max(1000).optional(),
  headline: z.string().max(250).optional(),
  website: z.string().url().max(250).optional().or(z.literal('')),
  isd_code: z.string().regex(/^\+\d{1,4}$/, 'Invalid ISD code format').optional(),
  mobile: z.string().regex(/^\+?[\d\s\-]{6,16}$/, 'Invalid phone number').optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

/**
 * Connection Request Schema
 */
export const ConnectionRequestSchema = z.object({
  target_user_id: z.string().uuid('Invalid target member UUID'),
  note: z.string().max(500, 'Connection note cannot exceed 500 characters').optional(),
});

export type ConnectionRequestInput = z.infer<typeof ConnectionRequestSchema>;

/**
 * Direct Message Schema
 */
export const DirectMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation UUID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters')
    .transform((val) => val.trim()),
  attachments: z.array(z.string().uuid()).max(10).optional(),
});

export type DirectMessageInput = z.infer<typeof DirectMessageSchema>;

/**
 * Freight Inquiry / Shipment Posting Schema
 */
export const FreightInquirySchema = z.object({
  origin_port: z.string().min(2).max(100),
  destination_port: z.string().min(2).max(100),
  cargo_type: z.enum(['FCL', 'LCL', 'Air', 'Bulk', 'Breakbulk', 'Reefer']),
  container_count: z.number().int().min(1).max(1000).optional(),
  target_rate_usd: z.number().positive().max(1000000).optional(),
  target_delivery_date: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export type FreightInquiryInput = z.infer<typeof FreightInquirySchema>;

/**
 * Upload Metadata Schema
 */
export const FileUploadMetadataSchema = z.object({
  file_name: z
    .string()
    .min(1)
    .max(255)
    .refine((name) => !name.includes('/') && !name.includes('\\'), {
      message: 'Filename cannot contain path traversal separators',
    }),
  file_size: z.number().int().positive().max(50 * 1024 * 1024, 'Max file size is 50MB'),
  claimed_mime_type: z.string().min(3).max(100),
  purpose: z.enum(['avatar', 'freight_document', 'shipment_attachment', 'kyc', 'general']),
});

export type FileUploadMetadata = z.infer<typeof FileUploadMetadataSchema>;

// =============================================================================
// Safe Validation Wrapper
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err) => `${err.path.join('.') || 'root'}: ${err.message}`
  );
  return { success: false, errors };
}

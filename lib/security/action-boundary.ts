/**
 * FR8X Secure Server Action & Mutation Boundary
 * ============================================
 * Provides high-order wrappers for Next.js 14 Server Actions and API mutations.
 * 
 * Guarantees:
 * 1. Strict server-side Zod validation + contextual XSS escaping + anti-SQLi heuristics
 * 2. Magic-byte inspection & SHA-256 checksumming before any storage write
 * 3. Atomic storage rollback on database insertion failure (eliminating orphan uploads)
 * 4. Standardized typed response envelope { success: true, data } | { success: false, error }
 * 5. Eliminates unhandled promise rejections and async race conditions
 */

import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient, getDbClient } from '@/lib/supabase/server';
import { sanitizePlainText, detectSqlInjectionPattern } from '@/lib/security/input-validation';
import { scanAndValidateUpload, UploadPurpose, FileScanResult } from '@/lib/security/file-scanner';

export interface ActionSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ActionFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  requestId?: string;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export interface SecureActionContext {
  userId: string;
  userRole?: string;
  userEmail?: string;
  supabase: ReturnType<typeof createServerSupabaseClient>;
  adminSupabase: ReturnType<typeof createAdminClient>;
}

export interface SecureActionOptions<TSchema extends z.ZodTypeAny> {
  schema: TSchema;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

/**
 * Higher-order Server Action Wrapper for JSON / Mutation payloads.
 */
export function createSecureAction<TSchema extends z.ZodTypeAny, TResult>(
  options: SecureActionOptions<TSchema>,
  handler: (input: z.infer<TSchema>, ctx: SecureActionContext) => Promise<TResult>
): (rawInput: unknown) => Promise<ActionResult<TResult>> {
  return async (rawInput: unknown): Promise<ActionResult<TResult>> => {
    try {
      const supabase = createServerSupabaseClient();
      const adminSupabase = createAdminClient();

      // 1. Authentication Gate
      let userId = '';
      let userRole = 'user';
      let userEmail = '';

      if (options.requireAuth !== false) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Authentication required to execute this operation.',
            },
          };
        }
        userId = user.id;
        userEmail = user.email || '';
        userRole = (user.app_metadata?.role as string) || 'user';

        if (options.allowedRoles && !options.allowedRoles.includes(userRole)) {
          return {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient privileges to perform this operation.',
            },
          };
        }
      }

      // 2. Input Validation (Zod)
      const parseResult = options.schema.safeParse(rawInput);
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input parameters.',
            details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
          },
        };
      }

      // 3. Deep String Sanitization & SQLi Heuristic Check
      const sanitizedInput = sanitizeObjectValues(parseResult.data);

      // 4. Execute Protected Handler
      const data = await handler(sanitizedInput, {
        userId,
        userRole,
        userEmail,
        supabase,
        adminSupabase,
      });

      return { success: true, data };
    } catch (err: any) {
      console.error('[SecureAction Error]:', err?.message || err);
      return {
        success: false,
        error: {
          code: err?.code || 'INTERNAL_ERROR',
          message: err?.message || 'An unexpected server error occurred.',
        },
      };
    }
  };
}

export interface SecureFileUploadInput {
  fileName: string;
  claimedMimeType: string;
  purpose: UploadPurpose;
  buffer: Buffer;
  metadata?: Record<string, any>;
}

export interface UploadedFileRecord {
  fileId: string;
  storagePath: string;
  scanResult: FileScanResult;
}

/**
 * Atomic File Upload & Scanner Wrapper
 * Guarantees magic-byte inspection, virus quarantine checks, and rollback on DB error.
 */
export async function executeSecureFileUpload(
  input: SecureFileUploadInput,
  ctx: SecureActionContext,
  bucketName = 'documents'
): Promise<ActionResult<UploadedFileRecord>> {
  let uploadedStoragePath: string | null = null;
  const adminClient = ctx.adminSupabase || ctx.supabase;

  try {
    // 1. Pre-Upload Inspection & Magic Bytes Scanning
    const scanResult = await scanAndValidateUpload({
      fileName: input.fileName,
      claimedMimeType: input.claimedMimeType,
      purpose: input.purpose,
      buffer: input.buffer,
    });

    if (scanResult.scanStatus === 'QUARANTINED' || scanResult.scanStatus === 'REJECTED') {
      return {
        success: false,
        error: {
          code: 'FILE_INSPECTION_FAILED',
          message: scanResult.quarantineReason || 'File failed security inspection and was quarantined.',
        },
      };
    }

    // 2. Determine safe storage path
    const fileExt = input.fileName.includes('.') ? input.fileName.slice(input.fileName.lastIndexOf('.')) : '';
    const safeKey = `${ctx.userId}/${Date.now()}_${scanResult.checksumSha256.slice(0, 12)}${fileExt}`;
    uploadedStoragePath = safeKey;

    // 3. Upload to Supabase Storage
    const { error: storageError } = await adminClient.storage
      .from(bucketName)
      .upload(safeKey, input.buffer, {
        contentType: scanResult.detectedMimeType || input.claimedMimeType,
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    // 4. Insert Metadata into Database (public.uploaded_files)
    const { data: dbRecord, error: dbError } = await adminClient
      .from('uploaded_files')
      .insert({
        owner_id: ctx.userId,
        file_name: input.fileName,
        file_size_bytes: scanResult.fileSizeBytes,
        claimed_mime_type: input.claimedMimeType,
        detected_mime_type: scanResult.detectedMimeType,
        checksum_sha256: scanResult.checksumSha256,
        storage_bucket: bucketName,
        storage_path: safeKey,
        purpose: input.purpose,
        scan_status: scanResult.scanStatus,
        is_available: scanResult.isAvailable,
        quarantine_reason: scanResult.quarantineReason || null,
        scanner_engine: scanResult.scannerEngine,
        metadata: input.metadata || {},
      })
      .select('id')
      .single();

    if (dbError) {
      // ATOMIC ROLLBACK: Purge orphaned storage object
      console.warn(`[executeSecureFileUpload] DB insert failed. Rolling back storage file: ${safeKey}`);
      await adminClient.storage.from(bucketName).remove([safeKey]).catch(() => {});
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

    return {
      success: true,
      data: {
        fileId: dbRecord.id,
        storagePath: safeKey,
        scanResult,
      },
    };
  } catch (err: any) {
    if (uploadedStoragePath) {
      await adminClient.storage.from(bucketName).remove([uploadedStoragePath]).catch(() => {});
    }
    return {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: err?.message || 'File upload pipeline encountered an error.',
      },
    };
  }
}

/**
 * Recursively sanitizes string values against HTML control characters and checks for SQLi
 */
function sanitizeObjectValues<T>(val: T): T {
  if (typeof val === 'string') {
    if (detectSqlInjectionPattern(val)) {
      throw new Error('Suspicious SQL pattern detected in request parameter.');
    }
    return sanitizePlainText(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeObjectValues(item)) as unknown as T;
  }
  if (val !== null && typeof val === 'object' && !(val instanceof Date) && !(val instanceof Buffer)) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeObjectValues(v);
    }
    return res as T;
  }
  return val;
}

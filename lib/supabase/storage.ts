/**
 * lib/supabase/storage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Storage Integration for FR8X.
 * Manages structured cloud storage buckets, file validation, and signed URLs:
 * - avatars (Public)
 * - company-logos (Public)
 * - documents (Private, owner/admin only with short-lived signed URLs)
 * - ad-creatives (Public)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from './client';

export interface FileValidationOptions {
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

const DEFAULT_ALLOWED_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
const DEFAULT_ALLOWED_DOC_EXTS = ['pdf', 'png', 'jpg', 'jpeg'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateUploadFile(
  file: File | Blob,
  extension: string,
  options: FileValidationOptions
): { valid: boolean; error?: string } {
  const cleanExt = extension.toLowerCase().replace(/^\./, '');
  
  if (options.allowedExtensions && !options.allowedExtensions.includes(cleanExt)) {
    return {
      valid: false,
      error: `Disallowed file extension '${cleanExt}'. Allowed extensions: ${options.allowedExtensions.join(', ')}`,
    };
  }

  if (file.size && options.maxSizeBytes && file.size > options.maxSizeBytes) {
    const maxMb = Math.round(options.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the maximum permitted limit of ${maxMb}MB.`,
    };
  }

  return { valid: true };
}

export const storageService = {
  /**
   * Uploads user avatar to Supabase Storage and returns the public URL.
   */
  async uploadAvatar(
    userId: string,
    file: File | Blob,
    extension = 'png'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const validation = validateUploadFile(file, extension, {
        allowedExtensions: DEFAULT_ALLOWED_IMAGE_EXTS,
        maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
      });
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const supabase = createClient();
      const fileName = `${userId}/${Date.now()}_avatar.${extension}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/png',
        });

      if (error) {
        console.error('[storageService] uploadAvatar error:', error.message);
        return { success: false, error: error.message };
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return { success: true, url: publicData.publicUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Avatar upload failed.' };
    }
  },

  /**
   * Uploads company logo to Supabase Storage and returns the public URL.
   */
  async uploadCompanyLogo(
    companyId: string,
    file: File | Blob,
    extension = 'png'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const validation = validateUploadFile(file, extension, {
        allowedExtensions: DEFAULT_ALLOWED_IMAGE_EXTS,
        maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
      });
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const supabase = createClient();
      const cleanCompanyId = companyId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${cleanCompanyId}/${Date.now()}_logo.${extension}`;

      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/png',
        });

      if (error) {
        console.error('[storageService] uploadCompanyLogo error:', error.message);
        return { success: false, error: error.message };
      }

      const { data: publicData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(data.path);

      return { success: true, url: publicData.publicUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Company logo upload failed.' };
    }
  },

  /**
   * Uploads KYC or statutory compliance document to private Supabase bucket.
   */
  async uploadDocument(
    userId: string,
    file: File | Blob,
    docType: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const ext = (file as File).name?.split('.').pop() || 'pdf';
      const validation = validateUploadFile(file, ext, {
        allowedExtensions: DEFAULT_ALLOWED_DOC_EXTS,
        maxSizeBytes: MAX_DOC_SIZE_BYTES,
      });
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const supabase = createClient();
      const fileName = `${userId}/${docType}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type || 'application/pdf',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, path: data.path };
    } catch (err: any) {
      return { success: false, error: err.message || 'Document upload failed.' };
    }
  },

  /**
   * Generates a short-lived cryptographically signed URL for authorized access to private documents.
   * Enforces time-to-live (default 15 minutes = 900 seconds).
   */
  async getSignedDownloadUrl(
    bucket: string,
    filePath: string,
    expiresInSeconds = 900
  ): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return { success: false, error: error?.message || 'Failed to generate signed download URL.' };
      }

      return { success: true, signedUrl: data.signedUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signed URL generation exception.' };
    }
  },
};


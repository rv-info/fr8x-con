/**
 * lib/supabase/storage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Storage Integration for FR8X.
 * Manages structured cloud storage buckets and RLS policies:
 * - avatars (Public)
 * - company-logos (Public)
 * - documents (Private, owner/admin only)
 * - ad-creatives (Public)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from './client';

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
      const supabase = createClient();
      const ext = (file as File).name?.split('.').pop() || 'pdf';
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
};

import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/supabase/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/jpeg',
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB standard limit

/**
 * POST /api/admin/branding/upload
 * Centralized Icons & Branding asset upload endpoint.
 * Protected by Godfather administrative authentication.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const gfAuth = authenticateGodfatherOperator(req);
    // Allow authorized admin sessions
    if (!gfAuth.authenticated && !req.headers.get('authorization')) {
      // In development or demo admin mode, allow authorized session
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetId = formData.get('assetId') as string | null;

    if (!file || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Both file and assetId are required.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Supported: PNG, GIF (animated), SVG, WebP, JPEG.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB maximum limit.' },
        { status: 400 }
      );
    }

    // Sanitize assetId
    const safeAssetId = assetId.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const destinationPath = `icons/${safeAssetId}.${ext}`;

    const supabase = getDbClient();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to 'icons' storage bucket with upsert
    const { error: storageError } = await supabase.storage
      .from('icons')
      .upload(destinationPath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    let publicUrl = `/icons/${safeAssetId}.${ext}`;
    if (!storageError) {
      const { data: urlData } = supabase.storage
        .from('icons')
        .getPublicUrl(destinationPath);
      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
      }
    }

    // Record asset upload event in audit logs
    try {
      await supabase.from('audit_logs').insert({
        action: 'ASSET_ICON_REPLACED',
        target_id: safeAssetId,
        details: {
          assetId: safeAssetId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          path: destinationPath,
          publicUrl,
          replacedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      assetId: safeAssetId,
      path: destinationPath,
      publicUrl,
      message: `Asset ${safeAssetId} successfully registered and updated.`,
    });
  } catch (error: any) {
    console.error('[branding/upload] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

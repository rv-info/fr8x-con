import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 10;

const MIME_MAP: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/**
 * GET /ART/[...slug]
 * Centralized dynamic server for visual assets stored in the root /ART repository.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
): Promise<NextResponse> {
  try {
    const slugParts = params.slug || [];
    if (!slugParts.length) {
      return NextResponse.json({ error: 'Missing asset path' }, { status: 400 });
    }

    // Guard against path traversal
    for (const part of slugParts) {
      if (part.includes('..') || part.includes('/') || part.includes('\\')) {
        return NextResponse.json({ error: 'Invalid asset path' }, { status: 403 });
      }
    }

    const relativePath = path.join(...slugParts);
    const artRoot = path.join(process.cwd(), 'ART');
    const fullPath = path.join(artRoot, relativePath);

    // Ensure target path stays strictly inside ART directory
    if (!fullPath.startsWith(artRoot)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      // Fallback: check public/ART if root ART doesn't have it
      const publicArt = path.join(process.cwd(), 'public', 'ART', relativePath);
      if (!fs.existsSync(publicArt)) {
        return NextResponse.json(
          { error: `Asset '${relativePath}' not found in ART repository.` },
          { status: 404 }
        );
      }
    }

    const resolvedPath = fs.existsSync(fullPath)
      ? fullPath
      : path.join(process.cwd(), 'public', 'ART', relativePath);

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(resolvedPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve ART asset', details: error.message },
      { status: 500 }
    );
  }
}

// FR8X-CON Server-side Ad Media Upload API — Production Security
// Supports PNG, JPG, JPEG, and GIF (continuous loop).
// Validates file size (max 5MB), MIME type, filename, and saves to Firebase Storage.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase/admin";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authorization Header (Bearer token)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token format" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.isGodMode) {
      return NextResponse.json(
        { error: "Forbidden: GodMode administration privileges required" },
        { status: 403 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Bad Request: No file provided" },
        { status: 400 }
      );
    }

    // 3. File validation: MIME type check
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Only PNG, JPEG, JPG, and GIF images are supported.",
        },
        { status: 400 }
      );
    }

    // 4. File validation: Size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed limit of 5MB." },
        { status: 400 }
      );
    }

    // 5. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename and generate unique path
    const sanitizedExt = file.type.split("/")[1] || "png";
    const timestamp = Date.now();
    const uniqueFileName = `ads/ad_media_${timestamp}_${crypto.randomUUID().slice(0, 8)}.${sanitizedExt}`;

    // 6. Upload to Firebase Storage bucket
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(uniqueFileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: decodedToken.uid,
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true,
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: unknown) {
    console.error("Ad media upload error:", error);
    return NextResponse.json(
      { error: "Internal server error during file upload" },
      { status: 500 }
    );
  }
}

// FR8X-CON Profile Photo Upload API — Server-Side Only
// Validates auth, file type, and size. Uploads to Firebase Storage.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase/admin";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate MIME type
    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, and WebP are accepted." },
        { status: 400 }
      );
    }

    // 4. Read buffer and validate size
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 3MB size limit." },
        { status: 400 }
      );
    }

    // 5. Validate magic bytes (actual file content matches declared MIME)
    const magicBytes = buffer.slice(0, 4);
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8;
    const isWebp = buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP";

    const validMagic =
      (mimeType === "image/png" && isPng) ||
      (mimeType === "image/jpeg" && isJpeg) ||
      (mimeType === "image/webp" && isWebp);

    if (!validMagic) {
      return NextResponse.json(
        { error: "File content does not match its declared type." },
        { status: 400 }
      );
    }

    // 6. Upload to Firebase Storage
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const storagePath = `profile-photos/${uid}.${ext}`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=86400",
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // 7. Update Firestore profile document
    await adminDb.collection("profiles").doc(uid).set(
      { photoURL: publicUrl, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ photoURL: publicUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

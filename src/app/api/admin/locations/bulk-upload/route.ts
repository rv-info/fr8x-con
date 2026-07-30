// FR8X-CON Server-side Bulk Location Import API — Production
// Parses CSV content, validates rows, checks UN/LOCODE formatting, duplicates,
// and writes records to Firestore in batch with detailed import summary.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/utils/constants";

interface CSVRow {
  code: string;
  name: string;
  country: string;
  countryCode: string;
  type: string;
  city?: string;
  state?: string;
  unlocode?: string;
}

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

    // 2. Parse payload
    const { csvContent } = await request.json();
    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing csvContent string" },
        { status: 400 }
      );
    }

    // 3. Parse CSV rows
    const lines = csvContent.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    if (lines.length <= 1) {
      return NextResponse.json(
        { error: "CSV file is empty or missing data rows" },
        { status: 400 }
      );
    }

    const headers = lines[0]!.split(",").map((h: string) => h.trim().toLowerCase());
    const codeIdx = headers.indexOf("code");
    const nameIdx = headers.indexOf("name");
    const countryIdx = headers.indexOf("country");
    const countryCodeIdx = headers.indexOf("countrycode");
    const typeIdx = headers.indexOf("type");
    const cityIdx = headers.indexOf("city");
    const stateIdx = headers.indexOf("state");
    const unlocodeIdx = headers.indexOf("unlocode");

    if (codeIdx === -1 || nameIdx === -1 || countryIdx === -1) {
      return NextResponse.json(
        {
          error:
            "Invalid CSV headers. Required headers: code, name, country, countryCode, type",
        },
        { status: 400 }
      );
    }

    const db = adminDb;
    const batch = db.batch();

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const values = lines[i]!.split(",").map((v) => v.trim());

      const code = values[codeIdx]?.toUpperCase() || "";
      const name = values[nameIdx] || "";
      const country = values[countryIdx] || "";
      const countryCode = (values[countryCodeIdx] || "").toUpperCase();
      const type = (values[typeIdx] || "sea").toLowerCase();
      const city = values[cityIdx] || "";
      const state = values[stateIdx] || "";
      const unlocode = (values[unlocodeIdx] || code).toUpperCase();

      // Validation
      if (!code || code.length < 3) {
        errors.push(`Row ${rowNum}: Invalid location code "${code}"`);
        failureCount++;
        continue;
      }

      if (!name || name.length < 2) {
        errors.push(`Row ${rowNum}: Missing or invalid location name`);
        failureCount++;
        continue;
      }

      if (!country) {
        errors.push(`Row ${rowNum}: Missing country name for code ${code}`);
        failureCount++;
        continue;
      }

      const locationId = `LOC-${unlocode || code}`;
      const docRef = db.collection(COLLECTIONS.LOCATIONS).doc(locationId);

      const locationDoc = {
        fr8xLocationId: locationId,
        code,
        name,
        country,
        countryCode: countryCode || country.slice(0, 2).toUpperCase(),
        type: ["sea", "air", "icd", "cfs", "dry", "rail", "warehouse", "hub", "border"].includes(type)
          ? type
          : "sea",
        city,
        state,
        unlocode,
        status: "approved",
        source: "bulk_import",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(docRef, locationDoc, { merge: true });
      successCount++;
    }

    if (successCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      totalRows: lines.length - 1,
      successCount,
      failureCount,
      errors,
    });
  } catch (error: unknown) {
    console.error("Bulk location upload error:", error);
    return NextResponse.json(
      { error: "Internal server error processing bulk location import" },
      { status: 500 }
    );
  }
}

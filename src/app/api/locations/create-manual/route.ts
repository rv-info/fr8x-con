import { NextRequest, NextResponse } from "next/server";
import { setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { LocationDoc, TransportMode, LocationType } from "@/lib/types/location";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      city,
      country,
      countryCode,
      type = "sea",
      transportModes = ["multimodal"],
      unlocode,
      iataCode,
      icaoCode,
      userId = "system_user",
    } = body;

    if (!name || !city || !country) {
      return NextResponse.json(
        { success: false, error: "Location Name, City, and Country are required." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const cleanCode = (unlocode || iataCode || `${(countryCode || country).slice(0, 2)}${city.slice(0, 3)}`).toUpperCase();
    const docId = `manual_loc_${cleanCode.toLowerCase()}_${timestamp}`;
    const fr8xLocationId = `LOC-MAN-${cleanCode}-${timestamp.toString().slice(-4)}`;

    const newLocation: LocationDoc = {
      id: docId,
      fr8xLocationId,
      code: cleanCode,
      name,
      city,
      country,
      countryCode: (countryCode || country.slice(0, 2)).toUpperCase(),
      type: type as LocationType,
      transportModes: Array.isArray(transportModes) ? (transportModes as TransportMode[]) : [transportModes],
      status: "pending_verification",
      source: "manual",
      unlocode: unlocode ? unlocode.toUpperCase() : undefined,
      iataCode: iataCode ? iataCode.toUpperCase() : undefined,
      icaoCode: icaoCode ? icaoCode.toUpperCase() : undefined,
      searchFrequency: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Save location record
    await setDocument(COLLECTIONS.LOCATIONS, docId, newLocation);

    // Record audit trail
    const auditId = `audit_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;
    await setDocument("location_audit", auditId, {
      id: auditId,
      locationId: docId,
      fr8xLocationId,
      action: "created_manual",
      status: "pending_verification",
      performedBy: userId,
      timestamp: new Date().toISOString(),
      details: `Manual location created by user. Queued for admin verification.`,
    });

    return NextResponse.json({
      success: true,
      message: "Location submitted and available immediately (Pending Verification).",
      data: newLocation,
    });
  } catch (err: any) {
    console.error("Error in create-manual location API:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create manual location" },
      { status: 500 }
    );
  }
}

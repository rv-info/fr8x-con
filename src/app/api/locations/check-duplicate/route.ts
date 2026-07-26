import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/firebase/firestore";
import { COLLECTIONS, LOCATION_SEED_DATA } from "@/lib/utils/constants";
import { LocationDoc } from "@/lib/types/location";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, city, country, unlocode, iataCode, icaoCode } = body;

    const normCode = (code || "").trim().toLowerCase();
    const normName = (name || "").trim().toLowerCase();
    const normCity = (city || "").trim().toLowerCase();
    const normCountry = (country || "").trim().toLowerCase();
    const normUnlocode = (unlocode || "").trim().toLowerCase();
    const normIata = (iataCode || "").trim().toLowerCase();
    const normIcao = (icaoCode || "").trim().toLowerCase();

    // Fetch existing database locations
    const docs = await queryDocuments<LocationDoc>(COLLECTIONS.LOCATIONS);
    
    // Combine with seed data
    const allLocations: any[] = [...LOCATION_SEED_DATA, ...docs];

    const duplicates: any[] = [];

    for (const loc of allLocations) {
      let isMatch = false;

      const locCode = (loc.code || "").toLowerCase();
      const locName = (loc.name || "").toLowerCase();
      const locCity = (loc.city || "").toLowerCase();
      const locCountry = (loc.country || "").toLowerCase();
      const locUnlocode = (loc.unlocode || "").toLowerCase();
      const locIata = (loc.iataCode || "").toLowerCase();
      const locIcao = (loc.icaoCode || "").toLowerCase();

      // Check exact code matches
      if (normUnlocode && locUnlocode === normUnlocode) isMatch = true;
      else if (normIata && locIata === normIata) isMatch = true;
      else if (normIcao && locIcao === normIcao) isMatch = true;
      else if (normCode && locCode === normCode) isMatch = true;

      // Check name + city + country match
      if (!isMatch && normName && normCity && locName === normName && locCity === normCity) {
        if (!normCountry || locCountry === normCountry) {
          isMatch = true;
        }
      }

      if (isMatch) {
        duplicates.push({
          id: loc.id || loc.code,
          fr8xLocationId: loc.fr8xLocationId || `LOC-${loc.code}`,
          name: loc.name,
          city: loc.city,
          country: loc.country,
          code: loc.code,
          unlocode: loc.unlocode,
          iataCode: loc.iataCode,
          status: loc.status || "approved",
        });
      }
    }

    return NextResponse.json({
      hasDuplicate: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
    });
  } catch (err: any) {
    console.error("Error in check-duplicate API:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check duplicates" },
      { status: 500 }
    );
  }
}

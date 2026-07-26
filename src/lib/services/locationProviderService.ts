import { LocationDoc, TransportMode, LocationType } from "@/lib/types/location";
import { setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

// In-memory provider cache to avoid repeated HTTP calls during a single server lifecycle
let externalAirportCache: LocationDoc[] | null = null;

/**
 * Fetch and parse airports from mwgg/Airports GitHub open repository as an offline/online fallback
 */
export async function fetchExternalAirports(): Promise<LocationDoc[]> {
  if (externalAirportCache) return externalAirportCache;
  
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json",
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.warn("Failed to fetch external airports fallback dataset.");
      return [];
    }

    const data = await response.json();
    const parsedLocations: LocationDoc[] = [];

    for (const [key, airport] of Object.entries<any>(data)) {
      if (!airport.iata || airport.iata.trim() === "") continue;
      
      const iata = airport.iata.toUpperCase();
      const icao = (airport.icao || "").toUpperCase();
      const code = iata;
      const name = airport.name || `Airport ${iata}`;
      const city = airport.city || airport.name || "";
      const country = airport.country || "";
      const countryCode = (airport.country || "").slice(0, 2).toUpperCase();

      parsedLocations.push({
        id: `ext_air_${iata.toLowerCase()}`,
        fr8xLocationId: `LOC-AIR-${iata}-EXT`,
        code,
        name,
        city,
        country,
        countryCode,
        type: "air",
        transportModes: ["air", "multimodal"],
        status: "approved",
        source: "ourairports",
        iataCode: iata,
        icaoCode: icao,
        coordinates: {
          lat: parseFloat(airport.lat) || 0,
          lng: parseFloat(airport.lon) || 0,
        },
        timezone: airport.tz || "",
        aliases: [iata, icao, city, name].filter(Boolean),
        searchFrequency: 1,
      });
    }

    externalAirportCache = parsedLocations;
    return parsedLocations;
  } catch (err) {
    console.error("Error fetching external airports fallback:", err);
    return [];
  }
}

/**
 * Query fallback providers for query matching
 */
export async function searchFallbackProviders(
  query: string,
  mode?: TransportMode
): Promise<LocationDoc[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  const results: LocationDoc[] = [];

  // Fallback to airport dataset if mode permits or is unspecified
  if (!mode || mode === "air" || mode === "multimodal") {
    const airports = await fetchExternalAirports();
    for (const airport of airports) {
      if (
        airport.iataCode?.toLowerCase() === normalizedQuery ||
        airport.icaoCode?.toLowerCase() === normalizedQuery ||
        airport.name.toLowerCase().includes(normalizedQuery) ||
        airport.city.toLowerCase().includes(normalizedQuery)
      ) {
        results.push(airport);
        if (results.length >= 10) break;
      }
    }
  }

  return results;
}

/**
 * Batch synchronize external dataset into local master database
 */
export async function syncExternalMasterData(
  sourceType: "ourairports" | "unlocode"
): Promise<{ syncedCount: number; message: string }> {
  try {
    let syncedCount = 0;

    if (sourceType === "ourairports") {
      const airports = await fetchExternalAirports();
      // Sync first 50 major airports to avoid Firestore rate limit issues during batch test
      const targetBatch = airports.slice(0, 50);

      for (const loc of targetBatch) {
        await setDocument(COLLECTIONS.LOCATIONS, loc.id, {
          ...loc,
          updatedAt: new Date().toISOString(),
        });
        syncedCount++;
      }
    }

    return {
      syncedCount,
      message: `Successfully synchronized ${syncedCount} records from ${sourceType}.`,
    };
  } catch (err: any) {
    console.error("Error in syncExternalMasterData:", err);
    throw new Error(err.message || "Failed to synchronize external master data");
  }
}

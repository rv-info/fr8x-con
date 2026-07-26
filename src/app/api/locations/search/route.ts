import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/firebase/firestore";
import { COLLECTIONS, LOCATION_SEED_DATA } from "@/lib/utils/constants";
import { LocationDoc, TransportMode } from "@/lib/types/location";
import { searchFallbackProviders } from "@/lib/services/locationProviderService";

// Simple Levenshtein distance helper for fuzzy matching
function getLevenshteinDistance(a: string, b: string): number {
  const dp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    dp[i] = [];
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) {
        dp[i]![j] = j;
      } else if (j === 0) {
        dp[i]![j] = i;
      } else {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i]![j] = Math.min(
          dp[i - 1]![j]! + 1,
          dp[i]![j - 1]! + 1,
          dp[i - 1]![j - 1]! + cost
        );
      }
    }
  }
  return dp[a.length]![b.length]!;
}

// Server-side global cache variable
let cachedLocations: LocationDoc[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache

async function getLocations(): Promise<LocationDoc[]> {
  const now = Date.now();
  if (cachedLocations && now - lastCacheTime < CACHE_TTL) {
    return cachedLocations;
  }

  try {
    const docs = await queryDocuments<any>(COLLECTIONS.LOCATIONS);
    
    // Combine seed data and Firestore docs
    const seedMap = new Map<string, any>();
    for (const seed of LOCATION_SEED_DATA) {
      seedMap.set(seed.code, seed);
    }
    for (const doc of docs) {
      seedMap.set(doc.code || doc.id, doc);
    }

    const combined = Array.from(seedMap.values()).map((loc) => ({
      ...loc,
      id: loc.id || `loc_${loc.code.toLowerCase()}`,
      fr8xLocationId: loc.fr8xLocationId || `LOC-SE-${loc.code}`,
      status: loc.status || "approved",
      transportModes: loc.transportModes || ["ocean", "air", "rail", "road", "multimodal"],
    }));

    // Filter approved and pending verification locations
    cachedLocations = combined.filter(
      (loc) => loc.status === "approved" || loc.status === "pending_verification"
    );
    lastCacheTime = now;
    return cachedLocations;
  } catch (err) {
    console.error("Failed to load locations from database for search API:", err);
    // Fallback to seed data if Firestore query fails
    return LOCATION_SEED_DATA.map((loc) => ({
      ...loc,
      id: `loc_${loc.code.toLowerCase()}`,
      fr8xLocationId: loc.fr8xLocationId || `LOC-SE-${loc.code}`,
      status: "approved",
      source: "seed",
      transportModes: loc.transportModes || ["ocean", "air", "rail", "road", "multimodal"],
    })) as LocationDoc[];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const mode = (searchParams.get("mode") || "multimodal").toLowerCase() as TransportMode;

    const allLocations = await getLocations();

    // Filter by transport mode
    const filtered = allLocations.filter((loc) => {
      if (!mode || mode === "multimodal") return true;
      if (loc.transportModes && loc.transportModes.includes(mode)) return true;
      
      const type = loc.type.toLowerCase();
      if (["ocean", "fcl", "lcl"].includes(mode)) {
        return ["sea", "icd", "cfs", "dry"].includes(type);
      }
      if (mode === "air") {
        return type === "air";
      }
      if (mode === "rail") {
        return ["rail", "dry", "icd"].includes(type);
      }
      if (mode === "road") {
        return ["road", "warehouse", "hub", "border"].includes(type);
      }
      return true;
    });

    if (!q) {
      const topLocations = filtered
        .sort((a, b) => (b.searchFrequency || 0) - (a.searchFrequency || 0))
        .slice(0, 15);
      return NextResponse.json({ success: true, count: topLocations.length, data: topLocations });
    }

    // Score and rank locations
    const scored = filtered.map((loc) => {
      let score = 0;
      const codeLower = (loc.code || "").toLowerCase();
      const fr8xIdLower = (loc.fr8xLocationId || "").toLowerCase();
      const unlocodeLower = (loc.unlocode || "").toLowerCase();
      const iataLower = (loc.iataCode || "").toLowerCase();
      const icaoLower = (loc.icaoCode || "").toLowerCase();
      const nameLower = (loc.name || "").toLowerCase();
      const cityLower = (loc.city || "").toLowerCase();
      const countryLower = (loc.country || "").toLowerCase();
      const aliases = (loc.aliases || []).map((a) => a.toLowerCase());

      if (codeLower === q || iataLower === q || icaoLower === q || unlocodeLower === q || fr8xIdLower === q) score += 1000;
      else if (codeLower.startsWith(q) || iataLower.startsWith(q) || unlocodeLower.startsWith(q)) score += 800;
      else if (nameLower === q || cityLower === q) score += 700;
      else if (nameLower.startsWith(q) || cityLower.startsWith(q)) score += 500;
      else if (aliases.includes(q)) score += 500;
      else if (aliases.some((a) => a.startsWith(q))) score += 400;
      else if (nameLower.includes(q) || cityLower.includes(q) || countryLower.includes(q)) score += 300;
      else if (aliases.some((a) => a.includes(q))) score += 200;

      if (q.length > 3 && score === 0) {
        const words = nameLower.split(/\s+/).concat(cityLower.split(/\s+/));
        for (const word of words) {
          if (word.length > 3) {
            const distance = getLevenshteinDistance(q, word);
            if (distance <= 2) {
              score += 150 - distance * 30;
              break;
            }
          }
        }
      }

      score += Math.min(100, loc.searchFrequency || 0);

      return { loc, score };
    });

    const results = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((item) => item.loc);

    // External provider fallback if local results are fewer than 3
    if (results.length < 3) {
      const fallbackResults = await searchFallbackProviders(q, mode);
      const existingCodes = new Set(results.map((r) => r.code.toLowerCase()));
      for (const fallback of fallbackResults) {
        if (!existingCodes.has(fallback.code.toLowerCase())) {
          results.push(fallback);
          if (results.length >= 15) break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err: any) {
    console.error("Error in location search API:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to search locations" },
      { status: 500 }
    );
  }
}

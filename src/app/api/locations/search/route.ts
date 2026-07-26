import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

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

interface LocationDoc {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  unlocode?: string;
  portCode?: string;
  iataCode?: string;
  icaoCode?: string;
  icdCode?: string;
  cfsCode?: string;
  railCode?: string;
  type: string;
  postalCode?: string;
  status: "active" | "disabled";
  coordinates?: string;
  timezone?: string;
  customsOffice?: string;
  portAuthority?: string;
  terminalOperator?: string;
  aliases?: string[];
  searchFrequency?: number;
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
    // Fetch all locations to perform server-side fuzzy search and sorting
    const docs = await queryDocuments<LocationDoc>(COLLECTIONS.LOCATIONS);
    // Filter active ones
    cachedLocations = docs.filter((doc) => doc.status === "active");
    lastCacheTime = now;
    return cachedLocations;
  } catch (err) {
    console.error("Failed to load locations from database for search API:", err);
    return cachedLocations || [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const mode = (searchParams.get("mode") || "multimodal").toLowerCase();

    // Load active locations from database/cache
    const allLocations = await getLocations();

    // 1. Filter by transport mode
    let filtered = allLocations;
    if (mode !== "multimodal" && mode !== "") {
      filtered = allLocations.filter((loc) => {
        const type = loc.type.toLowerCase();
        
        // Ocean Freight
        if (["fcl", "lcl", "break_bulk", "project_cargo", "roro"].includes(mode)) {
          return ["sea", "icd", "cfs", "rail"].includes(type);
        }
        // Air Freight
        if (mode === "air") {
          return ["air", "air_terminal"].includes(type);
        }
        // Rail Freight
        if (mode === "rail") {
          return ["rail", "dry", "icd"].includes(type);
        }
        // Road Freight
        if (mode === "road") {
          return ["city", "warehouse", "distribution_center", "customer_location"].includes(type);
        }
        
        return true;
      });
    }

    // 2. If query is empty, return top 10 locations by popularity (searchFrequency)
    if (!q) {
      const defaultList = [...filtered]
        .sort((a, b) => (b.searchFrequency || 0) - (a.searchFrequency || 0))
        .slice(0, 10);
      return NextResponse.json({ success: true, results: defaultList });
    }

    // 3. Compute matching scores for scoring & ranking
    const scoredList = filtered
      .map((loc) => {
        let score = 0;

        const nameLower = loc.name.toLowerCase();
        const cityLower = (loc.city || "").toLowerCase();
        const stateLower = (loc.state || "").toLowerCase();
        const countryLower = loc.country.toLowerCase();
        const codeLower = loc.code.toLowerCase();
        const unlocodeLower = (loc.unlocode || "").toLowerCase();
        const iataLower = (loc.iataCode || "").toLowerCase();
        const icaoLower = (loc.icaoCode || "").toLowerCase();
        const icdLower = (loc.icdCode || "").toLowerCase();
        const cfsLower = (loc.cfsCode || "").toLowerCase();
        const railLower = (loc.railCode || "").toLowerCase();
        const aliases = loc.aliases || [];

        // Exact code match gets absolute priority
        if (
          codeLower === q ||
          unlocodeLower === q ||
          iataLower === q ||
          icaoLower === q ||
          icdLower === q ||
          cfsLower === q ||
          railLower === q
        ) {
          score += 1000;
        }
        // Code prefix match
        else if (
          codeLower.startsWith(q) ||
          unlocodeLower.startsWith(q) ||
          iataLower.startsWith(q) ||
          icaoLower.startsWith(q) ||
          icdLower.startsWith(q) ||
          cfsLower.startsWith(q) ||
          railLower.startsWith(q)
        ) {
          score += 800;
        }

        // Exact name or city match
        if (nameLower === q || cityLower === q) {
          score += 700;
        }
        // Name or city prefix
        else if (nameLower.startsWith(q) || cityLower.startsWith(q)) {
          score += 500;
        }
        // Substring matches
        else if (nameLower.includes(q) || cityLower.includes(q)) {
          score += 300;
        }

        // Country / State matches
        if (countryLower === q || stateLower === q) {
          score += 400;
        } else if (countryLower.startsWith(q) || stateLower.startsWith(q)) {
          score += 250;
        } else if (countryLower.includes(q) || stateLower.includes(q)) {
          score += 100;
        }

        // Aliases / Abbreviations match
        for (const alias of aliases) {
          const aliasLower = alias.toLowerCase();
          if (aliasLower === q) {
            score += 500;
            break; // highest alias score
          } else if (aliasLower.startsWith(q)) {
            score += 300;
          } else if (aliasLower.includes(q)) {
            score += 150;
          }
        }

        // Fuzzy match for minor spelling mistakes (only for query strings longer than 3 characters)
        if (q.length > 3 && score === 0) {
          const words = nameLower.split(/\s+/).concat(cityLower.split(/\s+/));
          for (const word of words) {
            if (word.length > 3) {
              const distance = getLevenshteinDistance(q, word);
              if (distance <= 2) {
                score += 150 - distance * 30; // Closer is better
                break;
              }
            }
          }
        }

        // Add popularity (searchFrequency) weight
        if (score > 0) {
          score += Math.min(loc.searchFrequency || 0, 100);
        }

        return { loc, score };
      })
      .filter((item) => item.score > 0);

    // 4. Sort by score descending, then by popularity descending, then by name alphabetically
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.loc.searchFrequency || 0) !== (a.loc.searchFrequency || 0)) {
        return (b.loc.searchFrequency || 0) - (a.loc.searchFrequency || 0);
      }
      return a.loc.name.localeCompare(b.loc.name);
    });

    const finalResults = scoredList.map((item) => item.loc).slice(0, 10);

    return NextResponse.json({ success: true, results: finalResults });
  } catch (err: any) {
    console.error("Search API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

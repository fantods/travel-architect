import { getCachedOrFetch } from "./redis";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CACHE_TTL = 604800;

interface PlaceResult {
  name: string;
  placeId: string;
  url: string;
}

export async function searchPlace(query: string, context?: string): Promise<PlaceResult | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const searchQuery = context ? `${query}, ${context}` : query;
    const cacheKey = `place:${searchQuery}`;

    return await getCachedOrFetch<PlaceResult | null>(
      cacheKey,
      async () => {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`,
        );

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const place = data.results[0];
          return {
            name: place.name,
            placeId: place.place_id,
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          };
        }

        return null;
      },
      CACHE_TTL,
    );
  } catch (error) {
    console.error("Error searching for place:", error);
    return null;
  }
}

export async function searchMultiplePlaces(
  queries: string[],
  context?: string,
): Promise<Map<string, string>> {
  const placeUrls = new Map<string, string>();

  if (!GOOGLE_PLACES_API_KEY) {
    return placeUrls;
  }

  const uniqueQueries = [...new Set(queries)];

  const results = await Promise.all(
    uniqueQueries.map(async (query) => {
      const place = await searchPlace(query, context);
      return { query, place };
    }),
  );

  for (const { query, place } of results) {
    if (place) {
      placeUrls.set(query, place.url);
    }
  }

  return placeUrls;
}

export function extractDestination(text: string): string | null {
  const patterns = [
    /(?:plan a trip to|visit|travel to|going to)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+for|\s+in|\s*\?|$|\.)/i,
    /trip to\s+([A-Z][a-zA-Z\s,]+)/i,
    /in\s+([A-Z][a-zA-Z]+)(?:\s|$)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

export function extractPlaceNamesRegex(text: string): string[] {
  const lines = text.split("\n");
  const places: string[] = [];

  for (const line of lines) {
    if (line.includes("](") || line.match(/^#+/)) {
      continue;
    }

    const placePatterns = [
      /\b([A-Z][a-zA-Z\s]+(?:Park|Museum|Temple|Shrine|Beach|Square|Garden|Palace|Cathedral|Church|Market|Mall|Restaurant|Cafe|Hotel|Resort|Island|Bay|Lake|Mountain|Trail|Bridge|Tower|Castle|Monument|Statue|Fountain|Plaza|Arena|Stadium|Theater|Theatre|Gallery|Library|Station|Airport|Zoo|Aquarium))\b/g,
      /\*\*([^*]+(?:Park|Museum|Temple|Shrine|Beach|Square|Garden|Palace|Cathedral|Church|Market|Mall|Restaurant|Cafe|Hotel|Resort|Island|Bay|Lake|Mountain|Trail|Bridge|Tower|Castle|Monument|Statue|Fountain|Plaza|Arena|Stadium|Theater|Theatre|Gallery|Library|Station|Airport|Zoo|Aquarium))\*\*/g,
    ];

    for (const pattern of placePatterns) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const place = match[1].trim();
        if (place.length > 3 && place.length < 60 && !place.includes("[") && !place.includes("]")) {
          places.push(place);
        }
      }
    }
  }

  return [...new Set(places)];
}

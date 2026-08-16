import { geocodeApproximate } from "@/lib/data/csv";

export function parseMapsCoordinates(
  url: string,
): { latitude: number; longitude: number } | null {
  try {
    const parsed = new URL(url);
    const atMatch = `${parsed.pathname}${parsed.hash}`.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    );
    if (atMatch) {
      return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
    }
    for (const key of ["query", "q", "ll", "center"]) {
      const value = parsed.searchParams.get(key);
      if (!value) continue;
      const pair = value.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      if (pair) {
        return { latitude: Number(pair[1]), longitude: Number(pair[2]) };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function resolveCommunityCoordinates(input: {
  id: string;
  maps_url: string;
  locality: string | null;
  city: string | null;
  district: string | null;
}): { latitude: number; longitude: number } {
  const fromUrl = parseMapsCoordinates(input.maps_url);
  if (fromUrl) return fromUrl;
  const geo = geocodeApproximate({
    id: input.id,
    locality: input.locality,
    city: input.city,
    district: input.district || input.city || "Maharashtra",
  });
  return { latitude: geo.latitude, longitude: geo.longitude };
}

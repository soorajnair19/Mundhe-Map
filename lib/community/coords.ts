import { geocodeApproximate } from "@/lib/data/csv";
import {
  extractPlusCodeCandidate,
  resolvePlusCode,
  sanitizePlusCodeInput,
} from "@/lib/community/plus-code";
import {
  expandGoogleMapsUrl,
  isShortGoogleMapsUrl,
} from "@/lib/community/maps-url";

function parseLatLngPair(
  value: string,
): { latitude: number; longitude: number } | null {
  const pair = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!pair) return null;
  const latitude = Number(pair[1]);
  const longitude = Number(pair[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function parseMapsCoordinates(
  url: string,
  reference?: { latitude: number; longitude: number } | null,
): { latitude: number; longitude: number } | null {
  if (!url.trim()) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  })();

  // Place pin in Google Maps data blobs is usually more accurate than @ map center.
  const placePin = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placePin) {
    return {
      latitude: Number(placePin[1]),
      longitude: Number(placePin[2]),
    };
  }

  try {
    const parsed = new URL(url);
    const searchBlob = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    for (const key of ["ll", "center"]) {
      const value = parsed.searchParams.get(key);
      if (!value) continue;
      const coords = parseLatLngPair(value);
      if (coords) return coords;
    }

    for (const key of ["query", "q"]) {
      const value = parsed.searchParams.get(key);
      if (!value) continue;
      const coords = parseLatLngPair(value);
      if (coords) return coords;
      const fromPlus = resolvePlusCode(value, reference ?? null);
      if (fromPlus) {
        return { latitude: fromPlus.latitude, longitude: fromPlus.longitude };
      }
    }

    const atMatch = searchBlob.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
    }

    const plusInUrl = extractPlusCodeCandidate(searchBlob);
    if (plusInUrl) {
      const fromPlus = resolvePlusCode(plusInUrl, reference ?? null);
      if (fromPlus) {
        return { latitude: fromPlus.latitude, longitude: fromPlus.longitude };
      }
    }
  } catch {
    return null;
  }

  const loosePair = parseLatLngPair(decoded);
  if (loosePair) return loosePair;

  const plusInText = extractPlusCodeCandidate(decoded);
  if (plusInText) {
    const fromPlus = resolvePlusCode(plusInText, reference ?? null);
    if (fromPlus) {
      return { latitude: fromPlus.latitude, longitude: fromPlus.longitude };
    }
  }

  return null;
}

async function parseMapsCoordinatesResolved(
  url: string,
  reference?: { latitude: number; longitude: number } | null,
): Promise<{ latitude: number; longitude: number } | null> {
  const direct = parseMapsCoordinates(url, reference);
  if (direct) return direct;
  const expanded = await expandGoogleMapsUrl(url);
  if (expanded !== url) {
    return parseMapsCoordinates(expanded, reference);
  }
  return null;
}

function geocodeReference(input: {
  id: string;
  locality: string | null;
  city: string | null;
  district: string | null;
}): { latitude: number; longitude: number } {
  const geo = geocodeApproximate({
    id: input.id,
    locality: input.locality,
    city: input.city,
    district: input.district || input.city || "Maharashtra",
  });
  return { latitude: geo.latitude, longitude: geo.longitude };
}

export async function mapsUrlHasPrecisePin(
  url: string,
  reference?: { latitude: number; longitude: number } | null,
): Promise<boolean> {
  return (await parseMapsCoordinatesResolved(url, reference ?? null)) !== null;
}

export type CommunityLocationSource =
  | "manual"
  | "plus_code"
  | "maps_url"
  | "approximate";

export async function resolveCommunityLocation(input: {
  id: string;
  maps_url: string;
  plus_code?: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{
  latitude: number;
  longitude: number;
  plus_code: string | null;
  source: CommunityLocationSource;
}> {
  const reference = geocodeReference(input);

  if (input.latitude != null && input.longitude != null) {
    return {
      latitude: input.latitude,
      longitude: input.longitude,
      plus_code: sanitizePlusCodeInput(input.plus_code),
      source: "manual",
    };
  }

  const fromPlus = resolvePlusCode(input.plus_code, reference);
  if (fromPlus) {
    return {
      latitude: fromPlus.latitude,
      longitude: fromPlus.longitude,
      plus_code: fromPlus.code,
      source: "plus_code",
    };
  }

  const fromUrl = await parseMapsCoordinatesResolved(input.maps_url, reference);
  if (fromUrl) {
    return {
      ...fromUrl,
      plus_code: sanitizePlusCodeInput(input.plus_code),
      source: "maps_url",
    };
  }

  return {
    latitude: reference.latitude,
    longitude: reference.longitude,
    plus_code: sanitizePlusCodeInput(input.plus_code),
    source: "approximate",
  };
}

export async function resolveCommunityCoordinates(input: {
  id: string;
  maps_url: string;
  plus_code?: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ latitude: number; longitude: number; plus_code: string | null }> {
  const resolved = await resolveCommunityLocation(input);
  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    plus_code: resolved.plus_code,
  };
}

export async function applyCommunityLocation<
  T extends {
    id: string;
    maps_url: string;
    plus_code?: string | null;
    locality: string | null;
    city: string | null;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
  },
>(request: T): Promise<T> {
  const resolved = await resolveCommunityCoordinates({
    id: request.id,
    maps_url: request.maps_url,
    plus_code: request.plus_code,
    locality: request.locality,
    city: request.city,
    district: request.district,
    latitude: request.latitude,
    longitude: request.longitude,
  });
  request.latitude = resolved.latitude;
  request.longitude = resolved.longitude;
  request.plus_code = resolved.plus_code;
  return request;
}

/** Sync check for admin UI — short share links may already have stored coords. */
export function communityPinLooksApproximate(input: {
  maps_url: string;
  latitude: number | null;
  longitude: number | null;
}): boolean {
  if (input.latitude == null || input.longitude == null) return true;
  if (parseMapsCoordinates(input.maps_url)) return false;
  if (isShortGoogleMapsUrl(input.maps_url)) return false;
  return true;
}

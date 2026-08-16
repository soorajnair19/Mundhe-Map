import { OpenLocationCode } from "open-location-code";

const olc = new OpenLocationCode();

/** Matches local or global Open Location Codes, e.g. 5WVV+9X8M or 7JFJ5WVV+9X. */
const PLUS_CODE_PATTERN =
  /\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,8})\b/gi;

export function extractPlusCodeCandidate(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.toUpperCase().replace(/\s+/g, " ").trim();
  const matches = [...cleaned.matchAll(PLUS_CODE_PATTERN)].map(
    (match) => match[1],
  );
  if (!matches.length) return null;
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function sanitizePlusCodeInput(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

export interface ResolvedPlusCode {
  code: string;
  latitude: number;
  longitude: number;
}

export function resolvePlusCode(
  raw: string | null | undefined,
  reference: { latitude: number; longitude: number } | null,
): ResolvedPlusCode | null {
  const candidate = extractPlusCodeCandidate(raw);
  if (!candidate) return null;

  try {
    let code = candidate;
    if (!olc.isFull(code)) {
      if (!reference) return null;
      code = olc.recoverNearest(
        candidate,
        reference.latitude,
        reference.longitude,
      );
    }
    if (!olc.isFull(code)) return null;
    const area = olc.decode(code);
    return {
      code,
      latitude: area.latitudeCenter,
      longitude: area.longitudeCenter,
    };
  } catch {
    return null;
  }
}

/** @deprecated Use resolvePlusCode. */
export function coordsFromPlusCode(
  raw: string | null | undefined,
  reference?: { latitude: number; longitude: number } | null,
): { latitude: number; longitude: number } | null {
  const resolved = resolvePlusCode(raw, reference ?? null);
  if (!resolved) return null;
  return { latitude: resolved.latitude, longitude: resolved.longitude };
}

/** @deprecated Use sanitizePlusCodeInput or resolvePlusCode().code */
export function normalizePlusCode(raw: string | null | undefined): string | null {
  return extractPlusCodeCandidate(raw);
}

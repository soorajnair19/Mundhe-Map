import type {
  ActionType,
  BusinessType,
  CaseStatus,
  CaseType,
  LocationAccuracy,
  SourceType,
  VerificationStatus,
  ViolationType,
} from "@/lib/data/types";

/** Approximate locality centroids. Pins are neighborhood-level, not doorstep. */
const LOCALITY_COORDS: Record<string, [number, number]> = {
  "nariman point|mumbai": [18.9258, 72.826],
  "churchgate|mumbai": [18.9338, 72.8278],
  "marine lines|mumbai": [18.945, 72.8255],
  "fort|mumbai": [18.9338, 72.8354],
  "bhendi bazaar|mumbai": [18.9601, 72.8316],
  "umarkhadi|mumbai": [18.9608, 72.8365],
  "tardeo|mumbai": [18.9676, 72.812],
  "parel|mumbai": [19.003, 72.842],
  "bmc annexe|mumbai": [18.9402, 72.8354],
  "mahim west|mumbai": [19.041, 72.841],
  "bandra west|mumbai": [19.0596, 72.8295],
  "bandra east|mumbai": [19.06, 72.845],
  "santacruz east|mumbai": [19.081, 72.842],
  "juhu|mumbai": [19.1075, 72.8263],
  "andheri east|mumbai": [19.1136, 72.8697],
  "koldongari|mumbai": [19.119, 72.846],
  "vile parle west|mumbai": [19.103, 72.84],
  "goregaon|mumbai": [19.1663, 72.8526],
  "aarey road|mumbai": [19.1663, 72.8526],
  "malad west|mumbai": [19.186, 72.848],
  "borivali east|mumbai": [19.23, 72.864],
  "borivali west|mumbai": [19.229, 72.857],
  "dahisar|mumbai": [19.257, 72.862],
  "laxman tawde road|mumbai": [19.257, 72.862],
  "bhandup|mumbai": [19.148, 72.937],
  "bhandup west|mumbai": [19.148, 72.932],
  "ghatkopar west|mumbai": [19.086, 72.908],
  "vashi naka|mumbai": [19.052, 72.899],
  "chembur|mumbai": [19.0522, 72.9005],
  "kondhwa khurd|pune": [18.469, 73.889],
  "wadgaon sheri|pune": [18.551, 73.921],
  "shivajinagar|pune": [18.5308, 73.847],
  "sinhagad road|pune": [18.472, 73.822],
  "ambegaon|pune": [18.448, 73.85],
  "wagholi|pune": [18.58, 73.983],
  "bavdhan|pune": [18.515, 73.778],
  "pimple gurav|pune": [18.59, 73.813],
  "madde wasti|solapur": [17.6599, 75.9064],
  "satpur|nashik": [19.997, 73.74],
  "college road|nashik": [19.9975, 73.7898],
  "peth road|nashik": [20.007, 73.795],
  "panchavati|nashik": [20.007, 73.795],
  "cidco|nashik": [19.973, 73.764],
  "dindori|nashik": [20.17, 73.82],
  "malkapur|karad": [17.289, 74.181],
};

const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  solapur: [17.6599, 75.9064],
  karad: [17.289, 74.181],
};

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "mumbai city": [18.9388, 72.8354],
  "mumbai suburban": [19.13, 72.85],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  solapur: [17.6599, 75.9064],
  satara: [17.6805, 74.0183],
};

function key(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function hashOffset(id: string): [number, number] {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const lat = ((hash % 17) - 8) * 0.00018;
  const lng = (hash % 9) * 0.00012;
  return [lat, lng];
}

export function geocodeApproximate(input: {
  id: string;
  locality: string | null;
  city: string | null;
  district: string;
}): { latitude: number; longitude: number; location_accuracy: LocationAccuracy } {
  const locality = key(input.locality);
  const city = key(input.city);
  const district = key(input.district);
  const [dLat, dLng] = hashOffset(input.id);

  const localityHit =
    LOCALITY_COORDS[`${locality}|${city}`] ??
    LOCALITY_COORDS[`${locality}|${district}`];
  if (localityHit) {
    return {
      latitude: localityHit[0] + dLat,
      longitude: localityHit[1] + dLng,
      location_accuracy: "approximate",
    };
  }

  const cityHit = CITY_COORDS[city];
  if (cityHit) {
    return {
      latitude: cityHit[0] + dLat,
      longitude: cityHit[1] + dLng,
      location_accuracy: "approximate",
    };
  }

  const districtHit = DISTRICT_COORDS[district];
  if (districtHit) {
    return {
      latitude: districtHit[0] + dLat,
      longitude: districtHit[1] + dLng,
      location_accuracy: "district_only",
    };
  }

  return {
    latitude: 18.95 + dLat,
    longitude: 75.85 + dLng,
    location_accuracy: "unknown",
  };
}

export function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export function parseViolations(
  raw: string | null,
  caseId: string,
): { id: string; violation_type: ViolationType; description: string }[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const split = part.indexOf(":");
      const maybeType = split >= 0 ? part.slice(0, split).trim() : "";
      const description = split >= 0 ? part.slice(split + 1).trim() : part;
      const allowed: ViolationType[] = [
        "poor_hygiene",
        "pest_infestation",
        "expired_food",
        "adulteration",
        "improper_storage",
        "food_safety_violation",
        "unlicensed_operation",
        "missing_records",
        "employee_medical_records",
        "water_quality",
        "labelling",
        "temperature_control",
        "waste_management",
        "other",
      ];
      const violation_type = allowed.includes(maybeType as ViolationType)
        ? (maybeType as ViolationType)
        : "other";
      return {
        id: `${caseId}-vio-${index + 1}`,
        violation_type,
        description: description || part,
      };
    });
}

export function parseTimeline(
  raw: string | null,
  caseId: string,
): { id: string; status: CaseStatus; effective_date: string; notes: string | null }[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((part) => part.trim())
    .map((part, index) => {
      const match = part.match(/^(\d{4}-\d{2}-\d{2})(?:\s+to\s+\d{4}-\d{2}-\d{2})?:\s*(.+)$/i);
      if (!match) return null;
      const notes = match[2].trim();
      const status = inferStatusFromNotes(notes);
      return {
        id: `${caseId}-hist-${index + 1}`,
        status,
        effective_date: match[1],
        notes,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function inferStatusFromNotes(notes: string): CaseStatus {
  const value = notes.toLowerCase();
  if (value.includes("reinstat") || value.includes("restor")) return "reinstated";
  if (value.includes("cancel")) return "licence_cancelled";
  if (value.includes("suspend")) return "licence_suspended";
  if (value.includes("seal")) return "sealed";
  if (value.includes("seizure") || value.includes("seized")) return "seizure";
  if (value.includes("notice")) return "notice_issued";
  if (value.includes("inspect") || value.includes("raid") || value.includes("drive")) {
    return "inspected";
  }
  return "other";
}

export function sourceTypeFromName(name: string): SourceType {
  const value = name.toLowerCase();
  if (value.includes("indian express")) return "indian_express";
  if (value.includes("hindustan")) return "hindustan_times";
  if (value.includes("times of india")) return "times_of_india";
  if (value.includes("mid-day") || value.includes("mid day")) return "mid_day";
  if (value === "pti" || value.includes("press trust")) return "pti";
  if (value.includes("fda") || value.includes("government")) return "government";
  return "other_news";
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      current = "";
      if (row.some((cell) => cell.trim().length)) rows.push(row);
      row = [];
      continue;
    }
    current += char;
  }
  if (current.length || row.length) {
    row.push(current);
    if (row.some((cell) => cell.trim().length)) rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((keyName, index) => {
      record[keyName.trim()] = cells[index] ?? "";
    });
    return record;
  });
}

export const BUSINESS_TYPES = new Set<BusinessType>([
  "restaurant",
  "bakery",
  "hotel",
  "manufacturer",
  "retailer",
  "dairy",
  "cloud_kitchen",
  "other",
]);

export const CASE_TYPES = new Set<CaseType>([
  "inspection",
  "raid",
  "licence_suspension",
  "licence_cancellation",
  "closure",
  "sealing",
  "seizure",
  "notice",
  "other",
]);

export const CASE_STATUSES = new Set<CaseStatus>([
  "inspected",
  "notice_issued",
  "licence_suspended",
  "licence_cancelled",
  "sealed",
  "seizure",
  "reinstated",
  "other",
]);

export const ACTION_FROM_STATUS: Record<CaseStatus, ActionType> = {
  inspected: "inspection",
  notice_issued: "notice",
  licence_suspended: "licence_suspended",
  licence_cancelled: "licence_cancelled",
  sealed: "business_sealed",
  seizure: "seizure",
  reinstated: "other",
  other: "other",
};

export function asBusinessType(value: string | null): BusinessType {
  return BUSINESS_TYPES.has(value as BusinessType)
    ? (value as BusinessType)
    : "other";
}

export function asCaseType(value: string | null): CaseType {
  return CASE_TYPES.has(value as CaseType) ? (value as CaseType) : "other";
}

export function asCaseStatus(value: string | null): CaseStatus {
  return CASE_STATUSES.has(value as CaseStatus)
    ? (value as CaseStatus)
    : "other";
}

export function asVerification(value: string | null): VerificationStatus {
  if (value === "verified" || value === "reported" || value === "unverified" || value === "disputed") {
    return value;
  }
  return "reported";
}

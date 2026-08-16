import { geocodeApproximate, sourceTypeFromName } from "@/lib/data/csv";
import { normalizeName } from "@/lib/data/normalize";
import type {
  ActionType,
  BusinessType,
  CaseStatus,
  CaseType,
  ViolationType,
} from "@/lib/data/types";
import type { FDAReport } from "@/lib/admin/types";
import type { RssItem } from "@/lib/ingest/rss";

const AGENCY = /\b(fda|fssai|food safety)\b/i;

const ACTION =
  /\b(suspend|suspended|suspension|cancel|cancelled|canceled|cancellation|seal|sealed|seizure|seized|raid|raided)\b/i;

const NOISE =
  /\b(who is tukaram|standing ovation|sword to kill|spicejet|suspend services|high court warn|hc warns|hc flags|bombay hc warn|mosquito|saoji mutton|opinion|profile|fast-track restoration|replies to court|inspects \d+|asks .{0,60}to raid|requests .{0,60}to raid|to raid mumbai film)\b/i;

const MAHARASHTRA =
  /\b(maharashtra|mumbai|pune|nashik|nagpur|thane|navi mumbai|aurangabad|chhatrapati sambhajinagar|kolhapur|solapur|nanded|satara|karad|pimpri|chinchwad|kalyan|dombivli|vasai|virar|panvel|nanded|amravati|latur)\b/i;

const CITIES: { pattern: RegExp; city: string; district: string }[] = [
  { pattern: /\bnavi mumbai\b/i, city: "Navi Mumbai", district: "Thane" },
  { pattern: /\bmumbai\b/i, city: "Mumbai", district: "Mumbai Suburban" },
  { pattern: /\bpune|pimpri|chinchwad\b/i, city: "Pune", district: "Pune" },
  { pattern: /\bnashik\b/i, city: "Nashik", district: "Nashik" },
  { pattern: /\bnagpur\b/i, city: "Nagpur", district: "Nagpur" },
  { pattern: /\bthane\b/i, city: "Thane", district: "Thane" },
  { pattern: /\bsolapur\b/i, city: "Solapur", district: "Solapur" },
  { pattern: /\bkolhapur\b/i, city: "Kolhapur", district: "Kolhapur" },
  { pattern: /\bsatara|karad\b/i, city: "Karad", district: "Satara" },
  { pattern: /\baurangabad|sambhajinagar\b/i, city: "Chhatrapati Sambhajinagar", district: "Chhatrapati Sambhajinagar" },
];

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug || "place";
}

function dateOnly(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function isEnforcementCandidate(item: RssItem): boolean {
  const hay = `${item.title} ${item.snippet}`;
  if (NOISE.test(hay)) return false;
  return AGENCY.test(hay) && MAHARASHTRA.test(hay) && ACTION.test(hay);
}

export function storyClusterKey(title: string): string {
  const value = title.toLowerCase();
  const brands = [
    "blinkit",
    "zepto",
    "instamart",
    "domino",
    "parle agro",
    "parle",
    "burger king",
    "punjab grill",
    "tewari",
    "hotel amarpreet",
    "amarpreet",
    "iit bombay",
    "poornima",
    "frooti",
    "appy",
  ];
  const brand = brands.find((name) => value.includes(name));
  if (brand) return brand;
  return value
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 7)
    .join(" ");
}

function inferAction(text: string): {
  caseType: CaseType;
  status: CaseStatus;
  actionType: ActionType;
} {
  const value = text.toLowerCase();
  if (value.includes("cancel")) {
    return {
      caseType: "licence_cancellation",
      status: "licence_cancelled",
      actionType: "licence_cancelled",
    };
  }
  if (value.includes("seal")) {
    return { caseType: "sealing", status: "sealed", actionType: "business_sealed" };
  }
  if (value.includes("seiz")) {
    return { caseType: "seizure", status: "seizure", actionType: "seizure" };
  }
  if (value.includes("notice")) {
    return { caseType: "notice", status: "notice_issued", actionType: "notice" };
  }
  if (value.includes("suspend")) {
    return {
      caseType: "licence_suspension",
      status: "licence_suspended",
      actionType: "licence_suspended",
    };
  }
  if (value.includes("raid")) {
    return { caseType: "raid", status: "inspected", actionType: "inspection" };
  }
  if (value.includes("inspect")) {
    return { caseType: "inspection", status: "inspected", actionType: "inspection" };
  }
  return { caseType: "other", status: "other", actionType: "other" };
}

function inferBusinessType(text: string): BusinessType {
  const value = text.toLowerCase();
  if (value.includes("baker")) return "bakery";
  if (value.includes("hotel")) return "hotel";
  if (value.includes("dairy")) return "dairy";
  if (value.includes("cloud kitchen")) return "cloud_kitchen";
  if (value.includes("manufactur") || value.includes("factory")) return "manufacturer";
  if (value.includes("restaurant") || value.includes("eatery") || value.includes("resto")) {
    return "restaurant";
  }
  return "other";
}

function inferViolations(text: string, caseId: string): FDAReport["case"]["violations"] {
  const value = text.toLowerCase();
  const found: { type: ViolationType; description: string }[] = [];
  const add = (type: ViolationType, description: string) => {
    if (!found.some((item) => item.type === type)) found.push({ type, description });
  };
  if (/\brat|cockroach|pest|flies|insect/.test(value)) {
    add("pest_infestation", "Pest infestation reported in source");
  }
  if (value.includes("expired")) add("expired_food", "Expired food reported in source");
  if (value.includes("hygiene") || value.includes("unhygienic")) {
    add("poor_hygiene", "Hygiene lapses reported in source");
  }
  if (value.includes("adulter")) add("adulteration", "Adulteration reported in source");
  if (value.includes("label")) add("labelling", "Labelling issues reported in source");
  return found.map((item, index) => ({
    id: `${caseId}-vio-${index + 1}`,
    violation_type: item.type,
    description: item.description,
  }));
}

function extractPlaceName(title: string): string | null {
  const ofMatch = title.match(
    /(?:licence|license)\s+of\s+(?:the\s+)?["“]?([^"'”,:]{3,80}?)["”]?(?:\s+in\s+|\s+after\s+|\s+over\s+|,|$)/i,
  );
  if (ofMatch) return ofMatch[1].trim();
  const quoted = title.match(/["“]([^"”]{3,80})["”]/);
  if (quoted) return quoted[1].trim();
  const possessive = title.match(/([A-Z][\w'&.\s]{2,50})['’]s\s+(?:licence|license)/);
  if (possessive) return possessive[1].trim();
  return null;
}

function extractCity(text: string): { city: string | null; district: string } | null {
  for (const entry of CITIES) {
    if (entry.pattern.test(text)) return { city: entry.city, district: entry.district };
  }
  if (/\bmaharashtra\b/i.test(text)) {
    return { city: null, district: "Maharashtra" };
  }
  return null;
}

function headlineName(title: string): string {
  return title.replace(/\s[-–—]\s+.+$/, "").slice(0, 80).trim() || title.slice(0, 80);
}

export function reportFromRssItem(item: RssItem, nowIso: string): FDAReport {
  const text = `${item.title} ${item.snippet}`;
  const place = extractPlaceName(item.title);
  const location = extractCity(text);
  const action = inferAction(text);
  const name = place || headlineName(item.title);
  const city = location?.city ?? null;
  const district = location?.district ?? city ?? "Maharashtra";
  const slug = slugify(`${name}-${city ?? "mh"}`);
  const reportId = `fda-${slug}-${dateOnly(item.publishedAt) ?? nowIso.slice(0, 10)}`;
  const establishmentId = `est-${slug}`;
  const caseId = `case-${slug}-ingested`;
  const actionDate = dateOnly(item.publishedAt);
  const geo = geocodeApproximate({
    id: establishmentId,
    locality: null,
    city,
    district,
  });
  const confidence = place && city ? 0.55 : city ? 0.35 : 0.2;
  const mapsQuery = encodeURIComponent([name, city, "Maharashtra"].filter(Boolean).join(" "));
  const summary =
    item.snippet ||
    `${item.sourceName} reported: ${item.title}`;

  return {
    id: reportId,
    review_status: "pending",
    queued_at: nowIso,
    rejection_reason: null,
    rejection_notes: null,
    duplicate_of_case_id: null,
    establishment: {
      id: establishmentId,
      name,
      normalized_name: normalizeName(name),
      address: null,
      locality: null,
      district,
      city,
      state: "Maharashtra",
      pincode: null,
      latitude: geo.latitude,
      longitude: geo.longitude,
      location_accuracy: geo.location_accuracy,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
      business_type: inferBusinessType(text),
      created_at: nowIso,
      updated_at: nowIso,
    },
    case: {
      id: caseId,
      establishment_id: establishmentId,
      case_type: action.caseType,
      status: action.status,
      inspection_date: null,
      action_date: actionDate,
      summary,
      verification_status: "reported",
      confidence_score: confidence,
      created_at: nowIso,
      updated_at: nowIso,
      actions: actionDate
        ? [
            {
              id: `${caseId}-act-1`,
              action_type: action.actionType,
              action_date: actionDate,
              description: `${item.sourceName} report`,
            },
          ]
        : [],
      violations: inferViolations(text, caseId),
      sources: [
        {
          id: `${caseId}-src-1`,
          source_name: item.sourceName,
          source_type: sourceTypeFromName(item.sourceName),
          title: item.title,
          url: item.url,
          published_at: actionDate,
          is_primary: true,
        },
      ],
      status_history: actionDate
        ? [
            {
              id: `${caseId}-hist-1`,
              status: action.status,
              effective_date: actionDate,
              notes: item.title,
            },
          ]
        : [],
    },
  };
}

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

const CITY_NAMES = [
  "navi mumbai",
  "mumbai",
  "pune",
  "nashik",
  "nagpur",
  "thane",
  "solapur",
  "kolhapur",
  "satara",
  "karad",
  "aurangabad",
  "chhatrapati sambhajinagar",
  "sambhajinagar",
  "maharashtra",
  "india",
];

const KNOWN_BRANDS: { key: string; match: RegExp; name: string }[] = [
  { key: "tewari", match: /\btewari\b/i, name: "Tewari Bros. Mithaiwala" },
  { key: "amarpreet", match: /\bhotel\s+amarpreet\b|\bamarpreet\b/i, name: "Hotel Amarpreet" },
  { key: "poornima", match: /\bpoornima\b/i, name: "Poornima Restaurant" },
  { key: "burger king", match: /\bburger\s+king\b/i, name: "Burger King" },
  { key: "blinkit", match: /\bblinkit\b|ब्लिंकिट/i, name: "Blinkit" },
  { key: "zepto", match: /\bzepto\b/i, name: "Zepto" },
  { key: "instamart", match: /\binstamart\b/i, name: "Instamart" },
  { key: "domino", match: /\bdomino/i, name: "Domino's Pizza" },
  { key: "parle agro", match: /\bparle\s+agro\b|\bfrooti\b|\bappy\b/i, name: "Parle Agro" },
  { key: "punjab grill", match: /\bpunjab\s+grill\b/i, name: "Punjab Grill" },
  { key: "inducare", match: /\binducare\b/i, name: "Inducare Pharma" },
  { key: "iit bombay", match: /\biit\s+bombay\b/i, name: "IIT Bombay" },
  { key: "parle", match: /\bparle\b/i, name: "Parle Agro" },
];

const VENUE_SUFFIX =
  "sweet shops?|sweets shops?|mithaiwala|restaurant|resto|bakery|cafe|café|dhaba|grill|pizza|hotel|dairy|kitchen|warehouse|facility|bar";

export type ExtractedNameKind = "brand" | "parsed" | "generic" | "unknown";

export interface ExtractedEstablishmentName {
  name: string;
  kind: ExtractedNameKind;
}

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
  const brand = KNOWN_BRANDS.find((entry) => entry.match.test(title));
  if (brand) return brand.key;
  return title
    .toLowerCase()
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

function stripHeadlineChrome(title: string): string {
  return title
    .replace(/\s[-–—]\s+.+$/, "")
    .replace(
      /^(?:chhatrapati\s+sambhajinagar|navi mumbai|mumbai|pune|nashik|nagpur|thane)\s*:\s*/i,
      "",
    )
    .trim();
}

function titleCaseName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (/^(and|of|the)$/i.test(word)) return word.toLowerCase();
      if (word === word.toUpperCase() && word.length <= 5) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function looksLikeHeadlineName(value: string): boolean {
  const v = value.toLowerCase();
  if (value.length > 52) return true;
  if (
    /^(fda|fssai|maharashtra fda|bombay|high court|hc\b)/i.test(value.trim())
  ) {
    return true;
  }
  return /\b(suspends?|suspended|suspension|raid(?:ed|s)?|seized|seizure|orders?|directs?|fines?|lakh|crore|compensation|court|warns?|questioned|moves hc|over safety)\b/i.test(
    v,
  );
}

function isCityName(value: string): boolean {
  return CITY_NAMES.includes(value.toLowerCase().trim());
}

function cleanCapturedName(raw: string): string | null {
  let value = raw
    .replace(/["“”']/g, "")
    .replace(/\s+/g, " ")
    .trim();
  value = value.replace(/['’]s$/i, "").trim();
  value = value.replace(/[,:;|].*$/, "").trim();
  value = value.replace(
    /^(?:the|a|an|famous|iconic|popular|renowned|well-known)\s+/i,
    "",
  );
  if (!value || value.length < 3 || value.length > 52) return null;
  if (isCityName(value)) return null;
  if (looksLikeHeadlineName(value)) return null;
  if (/^\d+/.test(value)) return null;
  if (/^(on|over|for|after|as|in|of|to|from|by|why|how|the)\b/i.test(value)) {
    return null;
  }
  if (/\b(notice|improvement|finding|poor|raid|news|kitchen)\b/i.test(value)) {
    return null;
  }
  if (
    /\b(hotels|restaurants|establishments|licences|licenses)\b/i.test(value)
  ) {
    return null;
  }
  const words = value.split(" ");
  if (words.length === 1) return null;
  return titleCaseName(value);
}

function matchBrand(text: string): string | null {
  const brand = KNOWN_BRANDS.find((entry) => entry.match.test(text));
  return brand?.name ?? null;
}

function matchQuotedName(title: string): string | null {
  const quoted = title.match(/["“]([^"”]{3,60})["”]/);
  return quoted ? cleanCapturedName(quoted[1]) : null;
}

function matchLicenceOf(title: string): string | null {
  const match = title.match(
    /(?:licences?|licenses?)\s+of\s+(?:the\s+)?["“]?([^"'”|,]{3,60}?)["”]?(?:\s+in\s+|\s+after\s+|\s+over\s+|,|$)/i,
  );
  return match ? cleanCapturedName(match[1]) : null;
}

function matchPossessiveVenue(title: string): string | null {
  const matches = [
    ...title.matchAll(
      /([\p{L}][\p{L}\d'’&.\s.-]{1,50}?)['’]s\s+(?:(?:fssai|food|fda)\s+)?(?:licences?|licenses?|facility|warehouse)/giu,
    ),
  ];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const captured = cleanCapturedName(matches[index][1] ?? "");
    if (captured) return captured;
  }
  return null;
}

function matchHotelName(title: string): string | null {
  const match = title.match(
    /\b(Hotel\s+[A-Za-z][\w'’.-]*(?:\s+[A-Za-z][\w'’.-]*){0,3})/,
  );
  return match ? cleanCapturedName(match[1]) : null;
}

function matchVenueSuffix(title: string): string | null {
  const pattern = new RegExp(
    `\\b((?:[A-Za-z][\\w'’&.-]+\\s+){0,4}[A-Za-z][\\w'’&.-]+\\s+(?:${VENUE_SUFFIX}))\\b`,
    "i",
  );
  const match = title.match(pattern);
  return match ? cleanCapturedName(match[1]) : null;
}

function matchGenericVenue(
  title: string,
  city: string | null,
): ExtractedEstablishmentName | null {
  const counted = title.match(
    /\b(\d{1,2})\s+(?:famous\s+|iconic\s+|major\s+)?(?:(mumbai|pune|nashik|nagpur|thane|maharashtra)\s+)?(hotels?|restaurants?|establishments?)\b/i,
  );
  if (counted) {
    const place = counted[2]?.trim() || city || "Maharashtra";
    const kind = counted[3].toLowerCase().replace(/s$/, "");
    return {
      name: `Multiple ${titleCaseName(place)} ${kind}s`,
      kind: "generic",
    };
  }

  const generic = title.match(
    /\b((?:mumbai|pune|nashik|nagpur|thane|maharashtra)\s+(?:sweet shops?|sweets shops?|restaurants?|hotels?|warehouses?|facilit(?:y|ies)))\b/i,
  );
  if (generic) {
    const cleaned = cleanCapturedName(generic[1]);
    if (cleaned) return { name: cleaned, kind: "generic" };
  }

  return null;
}

export function extractEstablishmentName(
  title: string,
  snippet = "",
  city: string | null = null,
): ExtractedEstablishmentName {
  const headline = stripHeadlineChrome(title);
  const hay = `${headline} ${snippet}`;

  const brand = matchBrand(hay);
  if (brand) return { name: brand, kind: "brand" };

  const parsed =
    matchQuotedName(headline) ||
    matchLicenceOf(headline) ||
    matchPossessiveVenue(headline) ||
    matchHotelName(headline) ||
    matchVenueSuffix(headline);

  if (parsed) return { name: parsed, kind: "parsed" };

  const generic = matchGenericVenue(headline, city);
  if (generic) return generic;

  if (city) {
    return { name: `Unnamed establishment in ${city}`, kind: "unknown" };
  }
  return { name: "Unnamed establishment", kind: "unknown" };
}

export function nameLooksLikeHeadline(value: string): boolean {
  return looksLikeHeadlineName(value);
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

export function reportFromRssItem(item: RssItem, nowIso: string): FDAReport {
  const text = `${item.title} ${item.snippet}`;
  const location = extractCity(text);
  const city = location?.city ?? null;
  const district = location?.district ?? city ?? "Maharashtra";
  const extracted = extractEstablishmentName(item.title, item.snippet, city);
  const name = extracted.name;
  const action = inferAction(text);
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
  const confidence =
    extracted.kind === "brand" || extracted.kind === "parsed"
      ? city
        ? 0.55
        : 0.4
      : extracted.kind === "generic"
        ? 0.3
        : city
          ? 0.25
          : 0.2;
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

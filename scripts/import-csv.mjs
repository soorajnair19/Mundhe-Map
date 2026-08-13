import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csvPath = path.join(__dirname, "../data/seed/cases.csv");
const outPath = path.join(__dirname, "../data/seed/cases.json");

const LOCALITY_COORDS = {
  "nariman point|mumbai": [18.9256, 72.8242],
  "churchgate|mumbai": [18.9322, 72.8264],
  "marine lines|mumbai": [18.944, 72.8236],
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

const CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  solapur: [17.6599, 75.9064],
  karad: [17.289, 74.181],
};

const DISTRICT_COORDS = {
  "mumbai city": [18.9388, 72.8354],
  "mumbai suburban": [19.13, 72.85],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  solapur: [17.6599, 75.9064],
  satara: [17.6805, 74.0183],
};

function parseCsv(text) {
  const rows = [];
  let current = "";
  let inQuotes = false;
  let row = [];
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
    const record = {};
    header.forEach((keyName, index) => {
      record[keyName.trim()] = cells[index] ?? "";
    });
    return record;
  });
}

function blank(value) {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function hashOffset(id) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return [((hash % 17) - 8) * 0.00045, (((hash >> 4) % 17) - 8) * 0.00045];
}

function geocode(id, locality, city, district) {
  const loc = (locality ?? "").toLowerCase().trim();
  const cty = (city ?? "").toLowerCase().trim();
  const dist = (district ?? "").toLowerCase().trim();
  const [dLat, dLng] = hashOffset(id);
  const hit =
    LOCALITY_COORDS[`${loc}|${cty}`] || LOCALITY_COORDS[`${loc}|${dist}`];
  if (hit) {
    return { latitude: hit[0] + dLat, longitude: hit[1] + dLng, location_accuracy: "approximate" };
  }
  if (CITY_COORDS[cty]) {
    return {
      latitude: CITY_COORDS[cty][0] + dLat,
      longitude: CITY_COORDS[cty][1] + dLng,
      location_accuracy: "approximate",
    };
  }
  if (DISTRICT_COORDS[dist]) {
    return {
      latitude: DISTRICT_COORDS[dist][0] + dLat,
      longitude: DISTRICT_COORDS[dist][1] + dLng,
      location_accuracy: "district_only",
    };
  }
  return { latitude: 18.95 + dLat, longitude: 75.85 + dLng, location_accuracy: "unknown" };
}

function sourceType(name) {
  const value = name.toLowerCase();
  if (value.includes("indian express")) return "indian_express";
  if (value.includes("hindustan")) return "hindustan_times";
  if (value.includes("times of india")) return "times_of_india";
  if (value.includes("mid-day") || value.includes("mid day")) return "mid_day";
  if (value === "pti" || value.includes("press trust")) return "pti";
  return "other_news";
}

function inferStatus(notes) {
  const value = notes.toLowerCase();
  if (value.includes("reinstat") || value.includes("restor")) return "reinstated";
  if (value.includes("cancel")) return "licence_cancelled";
  if (value.includes("suspend")) return "licence_suspended";
  if (value.includes("seal")) return "sealed";
  if (value.includes("seizure") || value.includes("seized")) return "seizure";
  if (value.includes("notice")) return "notice_issued";
  if (value.includes("inspect") || value.includes("raid") || value.includes("drive")) return "inspected";
  return "other";
}

function parseViolations(raw, caseId) {
  if (!raw) return [];
  const allowed = new Set([
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
  ]);
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const split = part.indexOf(":");
      const maybeType = split >= 0 ? part.slice(0, split).trim() : "";
      const description = split >= 0 ? part.slice(split + 1).trim() : part;
      return {
        id: `${caseId}-vio-${index + 1}`,
        violation_type: allowed.has(maybeType) ? maybeType : "other",
        description: description || part,
      };
    });
}

function parseTimeline(raw, caseId) {
  if (!raw) return [];
  return raw
    .split("|")
    .map((part) => part.trim())
    .map((part, index) => {
      const match = part.match(/^(\d{4}-\d{2}-\d{2})(?:\s+to\s+\d{4}-\d{2}-\d{2})?:\s*(.+)$/i);
      if (!match) return null;
      return {
        id: `${caseId}-hist-${index + 1}`,
        status: inferStatus(match[2]),
        effective_date: match[1],
        notes: match[2].trim(),
      };
    })
    .filter(Boolean);
}

const ACTION_FROM_STATUS = {
  inspected: "inspection",
  notice_issued: "notice",
  licence_suspended: "licence_suspended",
  licence_cancelled: "licence_cancelled",
  sealed: "business_sealed",
  seizure: "seizure",
  reinstated: "other",
  other: "other",
};

const BUSINESS = new Set(["restaurant", "bakery", "hotel", "manufacturer", "retailer", "dairy", "cloud_kitchen", "other"]);
const CASE_TYPES = new Set(["inspection", "raid", "licence_suspension", "licence_cancellation", "closure", "sealing", "seizure", "notice", "other"]);
const STATUSES = new Set(["inspected", "notice_issued", "licence_suspended", "licence_cancelled", "sealed", "seizure", "reinstated", "other"]);

function normalizeName(name) {
  return name.toLowerCase().replace(/[.&'’",()/\\-]/g, " ").replace(/\s+/g, " ").trim();
}

const records = parseCsv(fs.readFileSync(csvPath, "utf8"));
const establishments = [];
const cases = [];
const seenPlaces = new Set();

for (const row of records) {
  const placeKey = blank(row.place_key);
  const name = blank(row.name);
  if (!placeKey || !name) continue;

  const geo = geocode(placeKey, blank(row.locality), blank(row.city), blank(row.district) || "unknown");
  const now = blank(row.source_published_at)
    ? `${row.source_published_at.trim()}T12:00:00+05:30`
    : "2026-08-13T12:00:00+05:30";

  if (!seenPlaces.has(placeKey)) {
    seenPlaces.add(placeKey);
    establishments.push({
      id: placeKey,
      name,
      normalized_name: normalizeName(name),
      address: blank(row.address),
      locality: blank(row.locality),
      district: blank(row.district) || "Unknown",
      city: blank(row.city),
      state: "Maharashtra",
      pincode: blank(row.pincode),
      latitude: Number(geo.latitude.toFixed(6)),
      longitude: Number(geo.longitude.toFixed(6)),
      location_accuracy: geo.location_accuracy,
      maps_url: blank(row.maps_url),
      business_type: BUSINESS.has(row.business_type) ? row.business_type : "other",
      created_at: now,
      updated_at: now,
    });
  }

  const status = STATUSES.has(row.status) ? row.status : "other";
  const caseId = `case-${placeKey}`;
  const inspectionDate = blank(row.inspection_date);
  const actionDate = blank(row.action_date);
  const history = parseTimeline(blank(row.timeline), caseId);
  const actionDateFinal = actionDate || inspectionDate || history.at(-1)?.effective_date || null;

  const sources = [];
  if (blank(row.source_url)) {
    sources.push({
      id: `${caseId}-src-1`,
      source_name: blank(row.source_name) || "Unknown",
      source_type: sourceType(row.source_name || ""),
      title: blank(row.source_title) || blank(row.source_name) || "Source",
      url: row.source_url.trim(),
      published_at: blank(row.source_published_at),
      is_primary: false,
    });
  }
  if (blank(row.source_url_2)) {
    sources.push({
      id: `${caseId}-src-2`,
      source_name: blank(row.source_name_2) || "Unknown",
      source_type: sourceType(row.source_name_2 || ""),
      title: blank(row.source_name_2) || "Additional source",
      url: row.source_url_2.trim(),
      published_at: blank(row.source_published_at),
      is_primary: false,
    });
  }

  const actions = [];
  if (inspectionDate) {
    actions.push({
      id: `${caseId}-act-inspect`,
      action_type: "inspection",
      action_date: inspectionDate,
      description: "Inspection reported by the source.",
    });
  }
  actions.push({
    id: `${caseId}-act-main`,
    action_type: ACTION_FROM_STATUS[status] || "other",
    action_date: actionDateFinal || inspectionDate || now.slice(0, 10),
    description: null,
  });

  cases.push({
    id: caseId,
    establishment_id: placeKey,
    case_type: CASE_TYPES.has(row.case_type) ? row.case_type : "other",
    status,
    inspection_date: inspectionDate,
    action_date: actionDateFinal,
    summary: blank(row.summary) || "",
    verification_status:
      row.verification_status === "verified" ||
      row.verification_status === "reported" ||
      row.verification_status === "unverified" ||
      row.verification_status === "disputed"
        ? row.verification_status
        : "reported",
    confidence_score: null,
    created_at: now,
    updated_at: now,
    actions,
    violations: parseViolations(blank(row.violations), caseId),
    sources,
    status_history: history,
  });
}

fs.writeFileSync(outPath, JSON.stringify({ establishments, cases }, null, 2));
console.log(`Wrote ${establishments.length} establishments and ${cases.length} cases`);

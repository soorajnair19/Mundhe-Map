import seed from "@/data/seed/cases.json";
import communitySeed from "@/data/seed/community-places.json";
import type {
  ActionType,
  CaseFilters,
  CaseStats,
  CaseType,
  CommunityPlace,
  CommunityStats,
  DatePreset,
  MapCase,
  MapLayer,
  SeedDataset,
  VerificationStatus,
} from "@/lib/data/types";
import { statusToMarkerKind, type MarkerKind } from "@/lib/data/status";

const dataset = seed as SeedDataset;
const communityPlaces = communitySeed as CommunityPlace[];

export const DEFAULT_MAP_LAYER: MapLayer = "enforcement";

const LICENCE_ACTIONS = new Set<string>([
  "licence_suspended",
  "licence_cancelled",
  "licence_suspension",
  "licence_cancellation",
]);

const SEALED_STATUSES = new Set(["sealed", "sealing", "business_sealed"]);

const SEIZURE_ACTIONS = new Set(["seizure"]);

const NOTICE_ACTIONS = new Set([
  "notice",
  "notice_issued",
  "improvement_notice",
  "closure",
]);

const LEGEND_KINDS = new Set<string>([
  "suspended",
  "cancelled",
  "sealed",
  "notice",
  "seizure",
  "other",
]);

export const DEFAULT_FILTERS: CaseFilters = {
  datePreset: "all",
  from: null,
  to: null,
  district: null,
  action: null,
  markerKind: null,
  verification: null,
};

export function getAllCommunityPlaces(): CommunityPlace[] {
  return communityPlaces;
}

export function getCommunityPlaceById(
  placeId: string,
  places: CommunityPlace[] = getAllCommunityPlaces(),
): CommunityPlace | null {
  return places.find((place) => place.id === placeId) ?? null;
}

export function computeCommunityStats(
  places: CommunityPlace[],
): CommunityStats {
  const cities = new Set(
    places
      .map((place) => place.city ?? place.district)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    totalReports: places.length,
    cities: cities.size,
    withEvidence: places.filter((place) => place.evidence.length > 0).length,
    repeatReports: places.filter((place) => place.similar_report_count > 1)
      .length,
  };
}

export function getAllMapCases(): MapCase[] {
  const byId = new Map(
    dataset.establishments.map((establishment) => [
      establishment.id,
      establishment,
    ]),
  );

  return dataset.cases
    .map((enforcementCase) => {
      const establishment = byId.get(enforcementCase.establishment_id);
      if (!establishment) return null;
      return { case: enforcementCase, establishment };
    })
    .filter((item): item is MapCase => item !== null);
}

export function getDistricts(cases: MapCase[] = getAllMapCases()): string[] {
  return [...new Set(cases.map((item) => item.establishment.district))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function resolveDateRange(
  filters: CaseFilters,
  now = new Date(),
): { from: Date | null; to: Date | null } {
  const startOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const endOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  };

  switch (filters.datePreset) {
    case "last_7_days": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now) };
    }
    case "last_30_days": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now) };
    }
    case "this_month": {
      const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { from, to: endOfDay(now) };
    }
    case "custom": {
      return {
        from: filters.from ? startOfDay(new Date(filters.from)) : null,
        to: filters.to ? endOfDay(new Date(filters.to)) : null,
      };
    }
    case "all":
    default:
      return { from: null, to: null };
  }
}

function caseEventDate(mapCase: MapCase): Date | null {
  const raw =
    mapCase.case.action_date ??
    mapCase.case.inspection_date ??
    mapCase.case.updated_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesAction(
  mapCase: MapCase,
  action: ActionType | CaseType,
): boolean {
  if (mapCase.case.case_type === action) return true;
  if (mapCase.case.status === action) return true;
  return mapCase.case.actions.some((item) => item.action_type === action);
}

export function filterMapCases(
  filters: CaseFilters,
  cases: MapCase[] = getAllMapCases(),
): MapCase[] {
  const { from, to } = resolveDateRange(filters);

  return cases.filter((mapCase) => {
    if (
      filters.verification &&
      mapCase.case.verification_status !== filters.verification
    ) {
      return false;
    }

    // Public default: exclude unverified unless explicitly filtered.
    if (
      !filters.verification &&
      mapCase.case.verification_status === "unverified"
    ) {
      return false;
    }

    if (
      filters.district &&
      mapCase.establishment.district !== filters.district
    ) {
      return false;
    }

    if (filters.action && !matchesAction(mapCase, filters.action)) {
      return false;
    }

    if (
      filters.markerKind &&
      statusToMarkerKind(mapCase.case.status) !== filters.markerKind
    ) {
      return false;
    }

    const eventDate = caseEventDate(mapCase);
    if (from && eventDate && eventDate < from) return false;
    if (to && eventDate && eventDate > to) return false;
    if ((from || to) && !eventDate) return false;

    return true;
  });
}

function matchesSet(mapCase: MapCase, values: Set<string>): boolean {
  return (
    values.has(mapCase.case.case_type) ||
    values.has(mapCase.case.status) ||
    mapCase.case.actions.some((action) => values.has(action.action_type))
  );
}

/** One primary outcome per case so KPI tiles can add up to the case total. */
function primaryOutcome(
  mapCase: MapCase,
): "sealed" | "licence" | "seizure" | "notice" | "other" {
  if (matchesSet(mapCase, SEALED_STATUSES)) return "sealed";
  if (matchesSet(mapCase, LICENCE_ACTIONS)) return "licence";
  if (matchesSet(mapCase, SEIZURE_ACTIONS)) return "seizure";
  if (matchesSet(mapCase, NOTICE_ACTIONS)) return "notice";
  return "other";
}

export function computeStats(cases: MapCase[]): CaseStats {
  let lastUpdated: string | null = null;
  let licenceActions = 0;
  let notices = 0;
  let seizures = 0;
  let sealed = 0;

  for (const item of cases) {
    if (!lastUpdated || item.case.updated_at > lastUpdated) {
      lastUpdated = item.case.updated_at;
    }

    switch (primaryOutcome(item)) {
      case "licence":
        licenceActions += 1;
        break;
      case "notice":
        notices += 1;
        break;
      case "seizure":
        seizures += 1;
        break;
      case "sealed":
        sealed += 1;
        break;
      default:
        break;
    }
  }

  return {
    totalCases: cases.length,
    licenceActions,
    notices,
    seizures,
    sealed,
    lastUpdated,
  };
}

export function getMapCaseById(
  caseId: string,
  cases: MapCase[] = getAllMapCases(),
): MapCase | null {
  return cases.find((item) => item.case.id === caseId) ?? null;
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): CaseFilters {
  const read = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  const datePreset = (read("date") as DatePreset | null) ?? "all";
  const validPresets: DatePreset[] = [
    "all",
    "last_7_days",
    "last_30_days",
    "this_month",
    "custom",
  ];

  return {
    datePreset: validPresets.includes(datePreset) ? datePreset : "all",
    from: read("from"),
    to: read("to"),
    district: read("district"),
    action: read("action") as ActionType | CaseType | null,
    markerKind: (() => {
      const kind = read("kind");
      return kind && LEGEND_KINDS.has(kind) ? kind : null;
    })(),
    verification: read("verification") as VerificationStatus | null,
  };
}

export function parseLayerFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): MapLayer {
  const read = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return read("view") === "community" ? "community" : DEFAULT_MAP_LAYER;
}

export function filtersToSearchParams(filters: CaseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.datePreset !== "all") params.set("date", filters.datePreset);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.district) params.set("district", filters.district);
  if (filters.action) params.set("action", filters.action);
  if (filters.markerKind) params.set("kind", filters.markerKind);
  if (filters.verification) params.set("verification", filters.verification);
  return params;
}

export function layerToSearchParams(
  layer: MapLayer,
  filters: CaseFilters,
): URLSearchParams {
  const params = filtersToSearchParams(filters);
  if (layer === "community") params.set("view", "community");
  return params;
}

export const LEGEND_FILTER_KINDS = [
  "suspended",
  "cancelled",
  "sealed",
  "notice",
  "seizure",
  "other",
] as const satisfies readonly MarkerKind[];

export const ACTION_FILTER_OPTIONS: {
  value: ActionType | CaseType;
  label: string;
}[] = [
  { value: "raid", label: "Raid" },
  { value: "notice", label: "Notice" },
  { value: "licence_suspended", label: "Licence suspended" },
  { value: "licence_cancelled", label: "Licence cancelled" },
  { value: "business_sealed", label: "Sealed" },
  { value: "seizure", label: "Seizure" },
  { value: "other", label: "Other" },
];

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
];

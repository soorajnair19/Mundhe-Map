import fdaSeed from "@/data/admin/pending-fda-reports.json";
import communitySeed from "@/data/admin/community-requests.json";
import { getAllMapCases } from "@/lib/data/load";
import type {
  CommunityPlace,
  EnforcementCase,
  Establishment,
} from "@/lib/data/types";
import type { CommunityRequestDraft } from "@/lib/community/schema";
import { resolveCommunityCoordinates } from "@/lib/community/coords";
import { normalizeName } from "@/lib/data/normalize";
import type {
  CommunityRequest,
  CommunityRequestStatus,
  DuplicatePlaceOption,
  FDAReport,
  FDAReviewStatus,
  PublishedPlaceOption,
  RejectionReason,
} from "@/lib/admin/types";

const STORE_VERSION = 3;

interface AdminStore {
  version: number;
  fdaReports: FDAReport[];
  communityRequests: CommunityRequest[];
}

const globalStore = globalThis as typeof globalThis & {
  __mundheAdminStore?: AdminStore;
};

function cloneStore(): AdminStore {
  return {
    version: STORE_VERSION,
    fdaReports: structuredClone(fdaSeed) as FDAReport[],
    communityRequests: structuredClone(communitySeed) as CommunityRequest[],
  };
}

function getStore(): AdminStore {
  if (
    !globalStore.__mundheAdminStore ||
    globalStore.__mundheAdminStore.version !== STORE_VERSION
  ) {
    globalStore.__mundheAdminStore = cloneStore();
  }
  return globalStore.__mundheAdminStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

function communityPlaceKey(name: string, city: string | null): string {
  return `${normalizeName(name)}|${normalizeName(city ?? "")}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "place";
}

function requestToPlace(request: CommunityRequest): CommunityPlace | null {
  if (
    request.status !== "approved" ||
    request.latitude == null ||
    request.longitude == null
  ) {
    return null;
  }
  return {
    id: request.published_place_id ?? request.id,
    place_name: request.place_name,
    maps_url: request.maps_url,
    address: request.address,
    locality: request.locality,
    city: request.city,
    district: request.district ?? request.city ?? "Maharashtra",
    latitude: request.latitude,
    longitude: request.longitude,
    concern: request.concern,
    evidence: request.evidence,
    submitted_at: request.submitted_at,
    similar_report_count: request.similar_report_count,
  };
}

function ensureMappable(request: CommunityRequest): void {
  if (request.latitude == null || request.longitude == null) {
    const coords = resolveCommunityCoordinates({
      id: request.id,
      maps_url: request.maps_url,
      locality: request.locality,
      city: request.city,
      district: request.district,
    });
    request.latitude = coords.latitude;
    request.longitude = coords.longitude;
  }
  if (!request.district) {
    request.district = request.city;
  }
  if (!request.published_place_id) {
    request.published_place_id = `place-${request.id.replace(/^req-/, "")}`;
  }
}

function findRequestByPlaceId(placeId: string): CommunityRequest | null {
  return (
    getStore().communityRequests.find(
      (request) =>
        request.published_place_id === placeId || request.id === placeId,
    ) ?? null
  );
}

export function getFDAReports(status?: FDAReviewStatus | "all"): FDAReport[] {
  const reports = getStore().fdaReports;
  if (!status || status === "all") return reports;
  return reports.filter((report) => report.review_status === status);
}

export function getPendingFDAReports(): FDAReport[] {
  return getFDAReports("pending");
}

export function getFDAReport(id: string): FDAReport | null {
  return getStore().fdaReports.find((report) => report.id === id) ?? null;
}

export function getCommunityRequests(
  status?: CommunityRequestStatus | "all",
): CommunityRequest[] {
  const requests = getStore().communityRequests;
  if (!status || status === "all") return requests;
  return requests.filter((request) => request.status === status);
}

export function getPendingCommunityRequests(): CommunityRequest[] {
  return getCommunityRequests("pending");
}

export function getCommunityRequest(id: string): CommunityRequest | null {
  return (
    getStore().communityRequests.find((request) => request.id === id) ?? null
  );
}

export function getPendingCounts(): {
  fda: number;
  community: number;
} {
  return {
    fda: getPendingFDAReports().length,
    community: getPendingCommunityRequests().length,
  };
}

export function getPublishedPlaceOptions(): PublishedPlaceOption[] {
  return getAllMapCases().map((item) => ({
    establishmentId: item.establishment.id,
    caseId: item.case.id,
    name: item.establishment.name,
    locality: item.establishment.locality,
    city: item.establishment.city,
  }));
}

export function getPublishedCommunityPlaces(): CommunityPlace[] {
  return getStore()
    .communityRequests.map(requestToPlace)
    .filter((place): place is CommunityPlace => place !== null);
}

export function getCommunityPlaceOptions(): DuplicatePlaceOption[] {
  return getPublishedCommunityPlaces().map((place) => ({
    id: place.id,
    name: place.place_name,
    locality: place.locality,
    city: place.city,
  }));
}

export function approveFDAReport(id: string): FDAReport | null {
  const report = getFDAReport(id);
  if (!report) return null;
  report.review_status = "approved";
  report.rejection_reason = null;
  report.rejection_notes = null;
  report.duplicate_of_case_id = null;
  report.case.updated_at = nowIso();
  return report;
}

export function rejectFDAReport(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): FDAReport | null {
  const report = getFDAReport(id);
  if (!report) return null;
  report.review_status = "rejected";
  report.rejection_reason = reason;
  report.rejection_notes = notes;
  report.duplicate_of_case_id = null;
  report.case.updated_at = nowIso();
  return report;
}

export function markFDAReportDuplicate(
  id: string,
  duplicateOfCaseId: string | null,
): FDAReport | null {
  const report = getFDAReport(id);
  if (!report) return null;
  report.review_status = "duplicate";
  report.duplicate_of_case_id = duplicateOfCaseId;
  report.rejection_reason = "duplicate";
  report.case.updated_at = nowIso();
  return report;
}

export function updateFDAReport(
  id: string,
  patch: { establishment: Establishment; case: EnforcementCase },
): FDAReport | null {
  const report = getFDAReport(id);
  if (!report) return null;
  const updatedAt = nowIso();
  report.establishment = {
    ...patch.establishment,
    updated_at: updatedAt,
  };
  report.case = {
    ...patch.case,
    establishment_id: report.establishment.id,
    updated_at: updatedAt,
  };
  return report;
}

export function approveCommunityRequest(id: string): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request) return null;
  ensureMappable(request);
  request.status = "approved";
  request.rejection_reason = null;
  request.rejection_notes = null;
  request.duplicate_of_place = null;
  return request;
}

export function rejectCommunityRequest(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request) return null;
  request.status = "rejected";
  request.rejection_reason = reason;
  request.rejection_notes = notes;
  request.duplicate_of_place = null;
  return request;
}

export function unpublishCommunityRequest(
  id: string,
): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request) return null;
  request.status = "pending";
  request.rejection_reason = null;
  request.rejection_notes = null;
  request.duplicate_of_place = null;
  return request;
}

export function restoreCommunityRequest(id: string): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request) return null;
  if (request.duplicate_of_place) {
    const target = findRequestByPlaceId(request.duplicate_of_place);
    if (target && target.similar_report_count > 1) {
      target.similar_report_count -= 1;
    }
  }
  request.status = "pending";
  request.rejection_reason = null;
  request.rejection_notes = null;
  request.duplicate_of_place = null;
  return request;
}

export function markCommunityRequestDuplicate(
  id: string,
  duplicateOfPlace: string | null,
): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request || !duplicateOfPlace) return null;
  const target = findRequestByPlaceId(duplicateOfPlace);
  if (!target) return null;

  request.status = "duplicate";
  request.duplicate_of_place = target.published_place_id ?? target.id;
  request.rejection_reason = "duplicate";
  request.rejection_notes = null;

  target.similar_report_count += 1;
  return request;
}

export function investigateCommunityRequest(
  id: string,
): CommunityRequest | null {
  const request = getCommunityRequest(id);
  if (!request) return null;
  request.status = "investigating";
  return request;
}

export function createCommunityRequest(
  draft: CommunityRequestDraft,
): CommunityRequest {
  const store = getStore();
  const id = `req-${slugify(draft.place_name)}-${Date.now().toString(36)}`;
  const key = communityPlaceKey(draft.place_name, draft.city);
  const similar = store.communityRequests.filter(
    (request) => communityPlaceKey(request.place_name, request.city) === key,
  ).length;
  const coords = resolveCommunityCoordinates({
    id,
    maps_url: draft.maps_url,
    locality: draft.locality,
    city: draft.city,
    district: draft.city,
  });

  const request: CommunityRequest = {
    id,
    status: "pending",
    place_name: draft.place_name,
    maps_url: draft.maps_url,
    address: draft.address,
    locality: draft.locality,
    city: draft.city,
    district: draft.city,
    latitude: coords.latitude,
    longitude: coords.longitude,
    concern: draft.concern,
    evidence: draft.evidence.map((item, index) => ({
      ...item,
      id: `${id}-ev-${index + 1}`,
    })),
    submitted_at: nowIso(),
    submitter: draft.submitter,
    similar_report_count: similar + 1,
    rejection_reason: null,
    rejection_notes: null,
    duplicate_of_place: null,
    published_place_id: null,
  };

  store.communityRequests.unshift(request);
  return request;
}

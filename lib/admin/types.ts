import type { EnforcementCase, Establishment } from "@/lib/data/types";

export type FDAReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "duplicate";

export type CommunityRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "duplicate"
  | "investigating";

export type RejectionReason =
  | "incorrect"
  | "duplicate"
  | "outside_maharashtra"
  | "insufficient_evidence"
  | "not_an_enforcement_action"
  | "other";

export interface FDAReport {
  id: string;
  review_status: FDAReviewStatus;
  queued_at: string;
  rejection_reason: RejectionReason | null;
  rejection_notes: string | null;
  duplicate_of_case_id: string | null;
  establishment: Establishment;
  case: EnforcementCase;
}

export interface CommunityEvidence {
  id: string;
  label: string;
  url: string | null;
}

export interface CommunityRequest {
  id: string;
  status: CommunityRequestStatus;
  place_name: string;
  maps_url: string;
  plus_code: string | null;
  address: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  concern: string;
  evidence: CommunityEvidence[];
  submitted_at: string;
  submitter: string | null;
  similar_report_count: number;
  rejection_reason: RejectionReason | null;
  rejection_notes: string | null;
  duplicate_of_place: string | null;
  published_place_id: string | null;
}

export interface PublishedPlaceOption {
  establishmentId: string;
  caseId: string;
  name: string;
  locality: string | null;
  city: string | null;
}

export interface DuplicatePlaceOption {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
}

export const FDA_REJECTION_REASONS: { value: RejectionReason; label: string }[] =
  [
    { value: "incorrect", label: "Incorrect" },
    { value: "duplicate", label: "Duplicate" },
    { value: "outside_maharashtra", label: "Outside Maharashtra" },
    { value: "insufficient_evidence", label: "Insufficient evidence" },
    { value: "not_an_enforcement_action", label: "Not an enforcement action" },
    { value: "other", label: "Other" },
  ];

export const COMMUNITY_REJECTION_REASONS: {
  value: RejectionReason;
  label: string;
}[] = [
  { value: "incorrect", label: "Incorrect" },
  { value: "duplicate", label: "Duplicate" },
  { value: "outside_maharashtra", label: "Outside Maharashtra" },
  { value: "insufficient_evidence", label: "Insufficient evidence" },
  { value: "not_an_enforcement_action", label: "Not an inspection request" },
  { value: "other", label: "Other" },
];

export type BusinessType =
  | "restaurant"
  | "bakery"
  | "hotel"
  | "manufacturer"
  | "retailer"
  | "dairy"
  | "cloud_kitchen"
  | "other";

export type CaseType =
  | "inspection"
  | "raid"
  | "licence_suspension"
  | "licence_cancellation"
  | "closure"
  | "sealing"
  | "seizure"
  | "notice"
  | "other";

export type ActionType =
  | "inspection"
  | "notice"
  | "improvement_notice"
  | "licence_suspended"
  | "licence_cancelled"
  | "business_sealed"
  | "seizure"
  | "prosecution"
  | "warning"
  | "other";

export type ViolationType =
  | "poor_hygiene"
  | "pest_infestation"
  | "expired_food"
  | "adulteration"
  | "improper_storage"
  | "food_safety_violation"
  | "unlicensed_operation"
  | "missing_records"
  | "employee_medical_records"
  | "water_quality"
  | "labelling"
  | "temperature_control"
  | "waste_management"
  | "other";

export type VerificationStatus =
  | "verified"
  | "reported"
  | "unverified"
  | "disputed";

export type SourceType =
  | "maharashtra_fda"
  | "government"
  | "indian_express"
  | "hindustan_times"
  | "times_of_india"
  | "mid_day"
  | "pti"
  | "other_news"
  | "social"
  | "community"
  | "other";

export type LocationAccuracy =
  | "exact"
  | "approximate"
  | "district_only"
  | "unknown";

export type CaseStatus =
  | "inspected"
  | "notice_issued"
  | "licence_suspended"
  | "licence_cancelled"
  | "sealed"
  | "seizure"
  | "reinstated"
  | "other";

export interface Establishment {
  id: string;
  name: string;
  normalized_name: string;
  address: string | null;
  locality: string | null;
  district: string;
  city: string | null;
  state: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
  location_accuracy: LocationAccuracy;
  maps_url: string | null;
  business_type: BusinessType;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  action_type: ActionType;
  action_date: string;
  description: string | null;
}

export interface Violation {
  id: string;
  violation_type: ViolationType;
  description: string;
}

export interface Source {
  id: string;
  source_name: string;
  source_type: SourceType;
  title: string;
  url: string;
  published_at: string | null;
  is_primary: boolean;
}

export interface StatusHistoryEvent {
  id: string;
  status: CaseStatus;
  effective_date: string;
  notes: string | null;
}

export interface EnforcementCase {
  id: string;
  establishment_id: string;
  case_type: CaseType;
  status: CaseStatus;
  inspection_date: string | null;
  action_date: string | null;
  summary: string;
  verification_status: VerificationStatus;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  actions: Action[];
  violations: Violation[];
  sources: Source[];
  status_history: StatusHistoryEvent[];
}

export interface SeedDataset {
  establishments: Establishment[];
  cases: EnforcementCase[];
}

/** Joined record used by map, panel, filters, and stats. */
export interface MapCase {
  case: EnforcementCase;
  establishment: Establishment;
}

export type DatePreset =
  | "all"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "custom";

export interface CaseFilters {
  datePreset: DatePreset;
  from: string | null;
  to: string | null;
  district: string | null;
  action: ActionType | CaseType | null;
  /** Marker kind from the legend filter (`suspended`, `notice`, …). */
  markerKind: string | null;
  verification: VerificationStatus | null;
}

export interface CaseStats {
  totalCases: number;
  licenceActions: number;
  notices: number;
  seizures: number;
  sealed: number;
  lastUpdated: string | null;
}

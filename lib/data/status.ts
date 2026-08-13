import type { CaseStatus } from "@/lib/data/types";

export type MarkerKind =
  | "suspended"
  | "cancelled"
  | "sealed"
  | "notice"
  | "inspection"
  | "seizure"
  | "other";

export function statusToMarkerKind(status: CaseStatus | string): MarkerKind {
  switch (status) {
    case "licence_suspended":
      return "suspended";
    case "licence_cancelled":
      return "cancelled";
    case "sealed":
      return "sealed";
    case "notice_issued":
      return "notice";
    case "inspected":
      return "inspection";
    case "seizure":
      return "seizure";
    default:
      return "other";
  }
}

export const MARKER_STYLES: Record<
  MarkerKind,
  { color: string; shape: "circle" | "square" | "diamond" | "triangle"; label: string }
> = {
  suspended: { color: "#0F6E56", shape: "square", label: "Licence suspended" },
  cancelled: { color: "#8B1E1E", shape: "diamond", label: "Licence cancelled" },
  sealed: { color: "#1F3A5F", shape: "triangle", label: "Sealed" },
  notice: { color: "#A15C07", shape: "circle", label: "Notice" },
  inspection: { color: "#3D5A80", shape: "circle", label: "Inspection" },
  seizure: { color: "#5C4B8A", shape: "square", label: "Seizure" },
  other: { color: "#5C6770", shape: "circle", label: "Other" },
};

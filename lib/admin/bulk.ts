import type { CommunityRequestStatus, FDAReviewStatus } from "@/lib/admin/types";

export type BulkStatusKind = "approve" | "reject" | "unpublish" | "restore";

export interface BulkUpdateResult {
  updated: number;
  skipped: number;
}

export function isFdaBulkEligible(
  status: FDAReviewStatus,
  kind: BulkStatusKind,
): boolean {
  switch (kind) {
    case "approve":
      return status !== "approved";
    case "reject":
      return status !== "rejected";
    case "unpublish":
      return status === "approved";
    case "restore":
      return status === "rejected" || status === "duplicate";
  }
}

export function isCommunityBulkEligible(
  status: CommunityRequestStatus,
  kind: BulkStatusKind,
): boolean {
  switch (kind) {
    case "approve":
      return status !== "approved";
    case "reject":
      return status !== "rejected";
    case "unpublish":
      return status === "approved";
    case "restore":
      return status === "rejected" || status === "duplicate";
  }
}

export function bulkSkipNote(eligible: number, total: number): string {
  const skipped = total - eligible;
  if (skipped <= 0) return "";
  return ` ${eligible} of ${total} selected (${skipped} ineligible will be skipped).`;
}

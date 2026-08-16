import type { CommunityEvidence } from "@/lib/admin/types";

/** User-submitted fields shared by the public form and admin review queue. */
export interface CommunityRequestDraft {
  place_name: string;
  maps_url: string;
  address: string | null;
  locality: string | null;
  city: string | null;
  concern: string;
  evidence: CommunityEvidence[];
  submitter: string | null;
}

export const COMMUNITY_REQUEST_FIELDS = {
  place_name: { label: "Restaurant name", required: true },
  locality: { label: "Locality", required: true },
  city: { label: "City", required: true },
  maps_url: { label: "Google Maps link", required: true },
  concern: { label: "What did you notice?", required: true },
  evidence: { label: "Attach photos", required: false },
} as const;

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;

export function isImageEvidenceUrl(url: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith("data:image/") ||
    /\.(jpe?g|png|webp|gif|heic|heif)(\?|$)/i.test(url)
  );
}

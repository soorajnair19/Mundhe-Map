import type { CommunityEvidence } from "@/lib/admin/types";
import type { CommunityRequestDraft } from "@/lib/community/schema";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "@/lib/community/schema";

const MAX = {
  place_name: 120,
  locality: 80,
  city: 80,
  maps_url: 500,
  concern: 1000,
} as const;

function read(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPhotoFile(file: File): boolean {
  return file.type.startsWith("image/");
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  return `data:${type};base64,${buffer.toString("base64")}`;
}

export async function parseCommunityRequestForm(
  formData: FormData,
): Promise<
  { ok: true; draft: CommunityRequestDraft } | { ok: false; error: string }
> {
  const place_name = read(formData, "place_name", MAX.place_name);
  const locality = read(formData, "locality", MAX.locality);
  const city = read(formData, "city", MAX.city);
  const maps_url = read(formData, "maps_url", MAX.maps_url);
  const concern = String(formData.get("concern") ?? "")
    .trim()
    .slice(0, MAX.concern);
  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (place_name.length < 2) {
    return { ok: false, error: "Enter the restaurant name." };
  }
  if (locality.length < 2) {
    return { ok: false, error: "Enter the locality." };
  }
  if (city.length < 2) {
    return { ok: false, error: "Enter the city." };
  }
  if (!isHttpUrl(maps_url)) {
    return { ok: false, error: "Paste a valid Google Maps link." };
  }
  if (concern.length < 12) {
    return { ok: false, error: "Describe what you noticed in a bit more detail." };
  }
  if (photos.length > MAX_PHOTOS) {
    return { ok: false, error: `You can attach up to ${MAX_PHOTOS} photos.` };
  }
  for (const photo of photos) {
    if (!isPhotoFile(photo)) {
      return { ok: false, error: "Attach photos only (JPG, PNG, or WebP)." };
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: "Each photo must be under 2.5 MB." };
    }
  }

  const evidence: CommunityEvidence[] = [];
  for (const [index, photo] of photos.entries()) {
    evidence.push({
      id: `photo-${index + 1}`,
      label: photo.name || `Photo ${index + 1}`,
      url: await fileToDataUrl(photo),
    });
  }

  return {
    ok: true,
    draft: {
      place_name,
      maps_url,
      address: null,
      locality,
      city,
      concern,
      evidence,
      submitter: null,
    },
  };
}

import { Suspense } from "react";
import { MapExperience } from "@/components/map/MapExperience";
import { getPublishedCommunityPlaces } from "@/lib/admin/store";
import { PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

function MapFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-[var(--muted)]">
      Loading {PRODUCT_NAME}…
    </div>
  );
}

export default function HomePage() {
  const communityPlaces = getPublishedCommunityPlaces();
  return (
    <Suspense fallback={<MapFallback />}>
      <MapExperience communityPlaces={communityPlaces} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { MapExperience } from "@/components/map/MapExperience";
import { PRODUCT_NAME } from "@/lib/branding";

function MapFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-[var(--muted)]">
      Loading {PRODUCT_NAME}…
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<MapFallback />}>
      <MapExperience />
    </Suspense>
  );
}

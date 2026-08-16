"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapView } from "@/components/map/MapView";
import { MapLayerTabs } from "@/components/map/MapLayerTabs";
import { ReportRestoModal } from "@/components/map/ReportRestoModal";
import { CaseDetailPanel } from "@/components/cases/CaseDetailPanel";
import { CommunityDetailPanel } from "@/components/cases/CommunityDetailPanel";
import { LegendFilter } from "@/components/filters/LegendFilter";
import { StatsBar } from "@/components/stats/StatsBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  computeCommunityStats,
  computeStats,
  filterMapCases,
  getAllCommunityPlaces,
  getAllMapCases,
  getCommunityPlaceById,
  getMapCaseById,
  layerToSearchParams,
  parseFiltersFromSearchParams,
  parseLayerFromSearchParams,
} from "@/lib/data/load";
import type { CaseFilters, MapLayer } from "@/lib/data/types";

export function MapExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allCases = useMemo(() => getAllMapCases(), []);
  const communityPlaces = useMemo(() => getAllCommunityPlaces(), []);

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const layer = useMemo(
    () => parseLayerFromSearchParams(searchParams),
    [searchParams],
  );

  const filteredCases = useMemo(
    () => filterMapCases(filters, allCases),
    [filters, allCases],
  );
  const stats = useMemo(() => computeStats(filteredCases), [filteredCases]);
  const communityStats = useMemo(
    () => computeCommunityStats(communityPlaces),
    [communityPlaces],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);

  const selectedCase = useMemo(() => {
    if (layer !== "enforcement" || !selectedId) return null;
    if (!filteredCases.some((item) => item.case.id === selectedId)) {
      return null;
    }
    return getMapCaseById(selectedId, allCases);
  }, [layer, selectedId, filteredCases, allCases]);

  const selectedPlace = useMemo(() => {
    if (layer !== "community" || !selectedId) return null;
    return getCommunityPlaceById(selectedId, communityPlaces);
  }, [layer, selectedId, communityPlaces]);

  const activeSelectedId =
    layer === "community"
      ? (selectedPlace?.id ?? null)
      : (selectedCase?.case.id ?? null);

  const statItems =
    layer === "community"
      ? [
          { label: "Reports", value: communityStats.totalReports },
          { label: "Cities", value: communityStats.cities },
          { label: "With evidence", value: communityStats.withEvidence },
          { label: "Repeat reports", value: communityStats.repeatReports },
        ]
      : [
          { label: "Cases", value: stats.totalCases },
          { label: "Licence actions", value: stats.licenceActions },
          { label: "Notices", value: stats.notices },
          { label: "Seizures", value: stats.seizures },
        ];

  const replaceQuery = useCallback(
    (nextLayer: MapLayer, nextFilters: CaseFilters) => {
      const params = layerToSearchParams(nextLayer, nextFilters);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const updateFilters = useCallback(
    (next: CaseFilters) => {
      replaceQuery(layer, next);
    },
    [layer, replaceQuery],
  );

  const setLayer = useCallback(
    (next: MapLayer) => {
      setSelectedId(null);
      replaceQuery(next, filters);
    },
    [filters, replaceQuery],
  );

  const setMarkerKind = useCallback(
    (markerKind: string | null) => {
      updateFilters({ ...filters, markerKind, action: null });
    },
    [filters, updateFilters],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (reportOpen) {
        closeReport();
        return;
      }
      setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reportOpen, closeReport]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 md:px-6">
        <StatsBar
          items={statItems}
          statsLabel={
            layer === "community"
              ? "Community report statistics"
              : "Case statistics"
          }
        />
      </header>

      <div className="relative min-h-[70vh] flex-1">
        <div className="absolute inset-0">
          <MapView
            layer={layer}
            cases={filteredCases}
            places={communityPlaces}
            selectedId={activeSelectedId}
            onSelect={setSelectedId}
          />
        </div>

        <MapLayerTabs layer={layer} onSelect={setLayer} />

        {layer === "enforcement" ? (
          <LegendFilter
            selectedKind={filters.markerKind}
            onSelect={setMarkerKind}
          />
        ) : (
          <div className="absolute bottom-4 left-4 z-10 flex w-[min(100%-2rem,20rem)] flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setReportOpen(true);
              }}
              className="rounded-md bg-[#E11D2E] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#c41826]"
            >
              Report a Resto
            </button>
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)]/95 px-2.5 py-2 text-xs text-[var(--muted)] shadow-sm backdrop-blur-sm">
              Places reported by the public. Not official enforcement actions.
            </div>
          </div>
        )}

        <CaseDetailPanel
          mapCase={selectedCase}
          onClose={() => setSelectedId(null)}
        />
        <CommunityDetailPanel
          place={selectedPlace}
          onClose={() => setSelectedId(null)}
        />
        {reportOpen ? <ReportRestoModal onClose={closeReport} /> : null}
      </div>

      <SiteFooter />
    </div>
  );
}

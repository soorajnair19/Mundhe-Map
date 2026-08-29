"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MapView } from "@/components/map/MapView";
import { MapLayerTabs } from "@/components/map/MapLayerTabs";
import { ReportRestoModal } from "@/components/map/ReportRestoModal";
import {
  MapSidePanel,
  type FilterResultItem,
  type ListStatusFilter,
} from "@/components/map/MapSidePanel";
import { LegendFilter } from "@/components/filters/LegendFilter";
import { StatsBar } from "@/components/stats/StatsBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  COMMUNITY_PIN_COLOR,
  MARKER_STYLES,
  pinAccent,
  type MarkerKind,
} from "@/lib/data/status";
import { formatStatus } from "@/lib/data/normalize";
import {
  computeCommunityStats,
  computeStats,
  filterMapCases,
  getAllMapCases,
  getCommunityPlaceById,
  getMapCaseById,
  layerToSearchParams,
  mergeMapCases,
  parseFiltersFromSearchParams,
  parseLayerFromSearchParams,
} from "@/lib/data/load";
import type { CaseFilters, CommunityPlace, MapCase, MapLayer } from "@/lib/data/types";
import type { StyleSpecification } from "maplibre-gl";

export function MapExperience({
  communityPlaces,
  publishedFdaCases = [],
  mapStyle,
}: {
  communityPlaces: CommunityPlace[];
  publishedFdaCases?: MapCase[];
  mapStyle: StyleSpecification;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allCases = useMemo(
    () => mergeMapCases(getAllMapCases(), publishedFdaCases),
    [publishedFdaCases],
  );

  const urlFilters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const urlLayer = useMemo(
    () => parseLayerFromSearchParams(searchParams),
    [searchParams],
  );
  const [layer, setLayerState] = useState(urlLayer);
  const [filters, setFiltersState] = useState(urlFilters);

  useEffect(() => {
    setLayerState(urlLayer);
  }, [urlLayer]);

  useEffect(() => {
    setFiltersState(urlFilters);
  }, [urlFilters]);

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
  const [listOpen, setListOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const closePanel = useCallback(() => {
    setSelectedId(null);
    setListOpen(false);
  }, []);
  const backToList = useCallback(() => {
    setSelectedId(null);
  }, []);

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
  const panelOpen = listOpen || Boolean(activeSelectedId);
  const statusFilter = useMemo((): ListStatusFilter | null => {
    if (layer !== "enforcement" || !filters.markerKind) return null;
    if (!(filters.markerKind in MARKER_STYLES)) return null;
    const kind = filters.markerKind as MarkerKind;
    const style = MARKER_STYLES[kind];
    return {
      label: style.label,
      accent: style.color,
      kind,
    };
  }, [layer, filters.markerKind]);

  const listItems = useMemo((): FilterResultItem[] => {
    if (layer === "community") {
      return [...communityPlaces]
        .map((place) => ({
          id: place.id,
          name: place.place_name,
          location: [place.locality, place.city].filter(Boolean).join(", "),
          district: place.district,
          statusLabel: "Community report",
          accent: COMMUNITY_PIN_COLOR,
          variant: "community" as const,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...filteredCases]
      .map((mapCase) => ({
        id: mapCase.case.id,
        name: mapCase.establishment.name,
        location: [
          mapCase.establishment.locality,
          mapCase.establishment.city,
        ]
          .filter(Boolean)
          .join(", "),
        district: mapCase.establishment.district,
        status: mapCase.case.status,
        statusLabel: formatStatus(mapCase.case.status),
        accent: pinAccent(mapCase.case.status).pin,
        variant: "enforcement" as const,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [layer, communityPlaces, filteredCases]);

  const listTitle =
    layer === "community"
      ? "Community reports"
      : filters.markerKind && filters.markerKind in MARKER_STYLES
        ? MARKER_STYLES[filters.markerKind as MarkerKind].label
        : "All cases";

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
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  const updateFilters = useCallback(
    (next: CaseFilters) => {
      setFiltersState(next);
      replaceQuery(layer, next);
    },
    [layer, replaceQuery],
  );

  const setLayer = useCallback(
    (next: MapLayer) => {
      setSelectedId(null);
      setListOpen(false);
      setLayerState(next);
      replaceQuery(next, filters);
    },
    [filters, replaceQuery],
  );

  const setMarkerKind = useCallback(
    (markerKind: string | null) => {
      setSelectedId(null);
      setListOpen(true);
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
      closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reportOpen, closeReport, closePanel]);

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
            mapStyle={mapStyle}
          />
        </div>

        <MapLayerTabs layer={layer} onSelect={setLayer} />

        {layer === "enforcement" ? (
          <LegendFilter
            selectedKind={filters.markerKind}
            onSelect={setMarkerKind}
          />
        ) : (
            <div className="absolute bottom-4 left-4 z-10 flex w-fit max-w-[calc(100%-2rem)] flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                closePanel();
                setReportOpen(true);
              }}
              className="w-fit rounded-md bg-[#E11D2E] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#c41826]"
            >
              Flag for inspection
            </button>
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)]/95 px-2.5 py-2 text-xs leading-snug text-[var(--muted)] shadow-sm backdrop-blur-sm">
              <p className="whitespace-nowrap max-sm:whitespace-normal">
                Flag restaurants you want FDA to inspect. This is not an official
                complaint.
              </p>
              <p className="whitespace-nowrap max-sm:whitespace-normal">
                For official reporting, submit a request to FDA{" "}
                <a
                  href="https://complaints.mahafda.in/complaint/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--accent)] underline underline-offset-2"
                >
                  here
                </a>
                .
              </p>
            </div>
          </div>
        )}

        <MapSidePanel
          open={panelOpen}
          listTitle={listTitle}
          items={listItems}
          showRowStatus={layer === "enforcement" && !filters.markerKind}
          statusFilter={statusFilter}
          selectedCase={selectedCase}
          selectedPlace={selectedPlace}
          onClose={closePanel}
          onSelect={setSelectedId}
          onBack={listOpen ? backToList : undefined}
        />
        {reportOpen ? <ReportRestoModal onClose={closeReport} /> : null}
      </div>

      <SiteFooter />
    </div>
  );
}

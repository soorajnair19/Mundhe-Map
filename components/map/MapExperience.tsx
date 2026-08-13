"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapView } from "@/components/map/MapView";
import { CaseDetailPanel } from "@/components/cases/CaseDetailPanel";
import { LegendFilter } from "@/components/filters/LegendFilter";
import { StatsBar } from "@/components/stats/StatsBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  computeStats,
  filterMapCases,
  filtersToSearchParams,
  getAllMapCases,
  getMapCaseById,
  parseFiltersFromSearchParams,
} from "@/lib/data/load";
import type { CaseFilters } from "@/lib/data/types";

export function MapExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allCases = useMemo(() => getAllMapCases(), []);

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const filteredCases = useMemo(
    () => filterMapCases(filters, allCases),
    [filters, allCases],
  );
  const stats = useMemo(() => computeStats(filteredCases), [filteredCases]);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    if (!filteredCases.some((item) => item.case.id === selectedCaseId)) {
      return null;
    }
    return getMapCaseById(selectedCaseId, allCases);
  }, [selectedCaseId, filteredCases, allCases]);

  const activeSelectedId = selectedCase?.case.id ?? null;

  const updateFilters = useCallback(
    (next: CaseFilters) => {
      const params = filtersToSearchParams(next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const setMarkerKind = useCallback(
    (markerKind: string | null) => {
      updateFilters({ ...filters, markerKind, action: null });
    },
    [filters, updateFilters],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCaseId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 md:px-6">
        <StatsBar stats={stats} />
      </header>

      <div className="relative min-h-[70vh] flex-1">
        <div className="absolute inset-0">
          <MapView
            cases={filteredCases}
            selectedCaseId={activeSelectedId}
            onSelectCase={setSelectedCaseId}
          />
        </div>

        <LegendFilter
          selectedKind={filters.markerKind}
          onSelect={setMarkerKind}
        />

        <CaseDetailPanel
          mapCase={selectedCase}
          onClose={() => setSelectedCaseId(null)}
        />
      </div>

      <SiteFooter />
    </div>
  );
}

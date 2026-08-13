"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapView } from "@/components/map/MapView";
import { CaseDetailPanel } from "@/components/cases/CaseDetailPanel";
import { FilterBar } from "@/components/filters/FilterBar";
import { StatsBar } from "@/components/stats/StatsBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  computeStats,
  filterMapCases,
  filtersToSearchParams,
  getAllMapCases,
  getDistricts,
  getMapCaseById,
  parseFiltersFromSearchParams,
} from "@/lib/data/load";
import type { CaseFilters } from "@/lib/data/types";
import { MARKER_STYLES, type MarkerKind } from "@/lib/data/status";
import { StatusIcon } from "@/components/status/StatusIcon";

export function MapExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allCases = useMemo(() => getAllMapCases(), []);
  const districts = useMemo(() => getDistricts(allCases), [allCases]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCaseId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <StatsBar stats={stats} />
      <FilterBar
        filters={filters}
        districts={districts}
        onChange={updateFilters}
      />

      <div className="relative min-h-[70vh] flex-1">
        <div className="absolute inset-0">
          <MapView
            cases={filteredCases}
            selectedCaseId={activeSelectedId}
            onSelectCase={setSelectedCaseId}
          />
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-md border border-[var(--border)] bg-[var(--panel)]/95 p-3 text-xs shadow-sm backdrop-blur-sm md:block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Marker status
          </p>
          <ul className="space-y-1.5">
            {Object.entries(MARKER_STYLES).map(([key, style]) => (
              <li key={key} className="flex items-center gap-2 text-[var(--ink)]">
                <StatusIcon
                  kind={key as MarkerKind}
                  size={14}
                  color={style.color}
                />
                {style.label}
              </li>
            ))}
          </ul>
        </div>

        <CaseDetailPanel
          mapCase={selectedCase}
          onClose={() => setSelectedCaseId(null)}
        />
      </div>

      <SiteFooter />
    </div>
  );
}

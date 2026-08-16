"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Flag, X } from "lucide-react";
import { CaseDetailContent } from "@/components/cases/CaseDetailPanel";
import { CommunityDetailContent } from "@/components/cases/CommunityDetailPanel";
import { StatusIcon } from "@/components/status/StatusIcon";
import type { MarkerKind } from "@/lib/data/status";
import type { CommunityPlace, MapCase, MapLayer } from "@/lib/data/types";

export interface FilterResultItem {
  id: string;
  name: string;
  location: string;
  district: string;
  statusLabel: string;
  status?: string;
  accent: string;
  variant: MapLayer;
}

export interface ListStatusFilter {
  label: string;
  accent: string;
  kind: MarkerKind;
}

interface MapSidePanelProps {
  open: boolean;
  listTitle: string;
  items: FilterResultItem[];
  showRowStatus: boolean;
  statusFilter: ListStatusFilter | null;
  selectedCase: MapCase | null;
  selectedPlace: CommunityPlace | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onBack?: () => void;
}

export function MapSidePanel({
  open,
  listTitle,
  items,
  showRowStatus,
  statusFilter,
  selectedCase,
  selectedPlace,
  onClose,
  onSelect,
  onBack,
}: MapSidePanelProps) {
  const showingDetail = Boolean(selectedCase || selectedPlace);
  const countLabel =
    items.length === 1 ? "1 place" : `${items.length} places`;
  const selectedId = selectedCase?.case.id ?? selectedPlace?.id ?? null;
  const selectedIndex = useMemo(
    () =>
      selectedId ? items.findIndex((item) => item.id === selectedId) : -1,
    [items, selectedId],
  );
  const fromList = Boolean(onBack);
  const showListNav = fromList && items.length > 1;
  const canPrev = showListNav && selectedIndex > 0;
  const canNext =
    showListNav && selectedIndex >= 0 && selectedIndex < items.length - 1;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    onSelect(items[selectedIndex - 1].id);
  }, [canPrev, items, onSelect, selectedIndex]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    onSelect(items[selectedIndex + 1].id);
  }, [canNext, items, onSelect, selectedIndex]);

  useEffect(() => {
    if (!open || !showListNav || !showingDetail) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, open, showListNav, showingDetail]);

  const listNav = showListNav
    ? { onPrev: goPrev, onNext: goNext, canPrev, canNext }
    : {};

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,23,22,0.28)] transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-12px_0_40px_rgba(15,23,22,0.08)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label={showingDetail ? "Place details" : "Filtered places"}
      >
        {open && selectedCase ? (
          <CaseDetailContent
            mapCase={selectedCase}
            onClose={onClose}
            onBack={onBack}
            {...listNav}
          />
        ) : null}
        {open && selectedPlace ? (
          <CommunityDetailContent
            place={selectedPlace}
            onClose={onClose}
            onBack={onBack}
            {...listNav}
          />
        ) : null}
        {open && !showingDetail ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                {statusFilter ? (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide text-white"
                    style={{ backgroundColor: statusFilter.accent }}
                  >
                    <StatusIcon kind={statusFilter.kind} size={12} color="#fff" />
                    {statusFilter.label}
                  </div>
                ) : (
                  <h2 className="text-xl font-medium leading-tight text-[var(--ink)]">
                    {listTitle}
                  </h2>
                )}
                <p
                  className={`text-sm text-[var(--muted)] ${
                    statusFilter ? "mt-2" : "mt-1"
                  }`}
                >
                  {countLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-1.5 rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                aria-label="Close panel"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--muted)]">
                No places in this filter.
              </p>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="flex w-full flex-col items-start gap-1 px-5 py-3.5 text-left transition hover:bg-[var(--surface)]"
                    >
                      <span className="text-sm font-medium text-[var(--ink)]">
                        {item.name}
                      </span>
                      <span className="text-xs leading-snug text-[var(--muted)]">
                        {[item.location, item.district]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {showRowStatus ? (
                        item.variant === "community" ? (
                          <span
                            className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white"
                            style={{ backgroundColor: item.accent }}
                          >
                            <Flag size={11} strokeWidth={2.25} aria-hidden />
                            {item.statusLabel}
                          </span>
                        ) : (
                          <span
                            className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white"
                            style={{ backgroundColor: item.accent }}
                          >
                            <StatusIcon
                              status={item.status}
                              size={11}
                              color="#fff"
                            />
                            {item.statusLabel}
                          </span>
                        )
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}

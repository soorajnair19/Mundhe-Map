"use client";

import type { MapLayer } from "@/lib/data/types";

const TABS: { id: MapLayer; label: string; description: string }[] = [
  {
    id: "enforcement",
    label: "Enforcement",
    description: "Publicly reported enforcement actions",
  },
  {
    id: "community",
    label: "Community",
    description: "Places reported by the public",
  },
];

interface MapLayerTabsProps {
  layer: MapLayer;
  onSelect: (layer: MapLayer) => void;
}

export function MapLayerTabs({ layer, onSelect }: MapLayerTabsProps) {
  return (
    <div
      className="pointer-events-auto absolute top-4 left-4 z-10 inline-flex rounded-md border border-[var(--border)] bg-[var(--panel)]/95 p-0.5 shadow-sm backdrop-blur-sm"
      role="tablist"
      aria-label="Map data source"
    >
      {TABS.map((tab) => {
        const active = layer === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={tab.description}
            className={`whitespace-nowrap rounded-[5px] px-3 py-1.5 text-xs transition ${
              active
                ? "bg-[var(--ink)] font-medium text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

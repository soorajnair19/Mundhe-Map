"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapCase } from "@/lib/data/types";
import { statusToMarkerKind, MARKER_STYLES, pinAccent } from "@/lib/data/status";
import {
  formatMonthYear,
  formatStatus,
} from "@/lib/data/normalize";
import {
  MUMBAI_BOUNDS,
  MUMBAI_CENTER,
  MUMBAI_DEFAULT_ZOOM,
  MAHARASHTRA_MAX_BOUNDS,
  MAHARASHTRA_MAX_ZOOM,
  MAHARASHTRA_MIN_ZOOM,
  MAP_STYLE,
} from "@/lib/geo/maharashtra";
import { MarkerTooltip } from "@/components/map/MarkerTooltip";

interface MapViewProps {
  cases: MapCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string | null) => void;
}

interface HoverState {
  caseId: string;
  x: number;
  y: number;
}

const CASE_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" class="map-case-pin__icon" aria-hidden="true"><path d="M0 0h14v14H0z" fill="none"/><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.15"><path d="M13.48 7.516a6.5 6.5 0 1 1-6.93-7"/><path d="M9.79 8.09A3 3 0 1 1 5.9 4.21M7 7l2.5-2.5m2 .5l-2-.5l-.5-2l2-2l.5 2l2 .5z"/></g></svg>`;

function createPinElement(mapCase: MapCase, selected: boolean): HTMLButtonElement {
  const kind = statusToMarkerKind(mapCase.case.status);
  const style = MARKER_STYLES[kind];
  const button = document.createElement("button");
  button.type = "button";
  button.className = `map-case-pin${selected ? " is-selected" : ""}`;
  button.style.setProperty("--pin-color", style.color);
  button.setAttribute(
    "aria-label",
    `${mapCase.establishment.name}, ${formatStatus(mapCase.case.status)}`,
  );
  button.innerHTML = CASE_PIN_SVG;
  return button;
}

export function MapView({ cases, selectedCaseId, onSelectCase }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelectCase);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [ready, setReady] = useState(false);
  const casesById = useMemo(
    () => new Map(cases.map((item) => [item.case.id, item])),
    [cases],
  );

  onSelectRef.current = onSelectCase;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const map = new MapLibreMap({
      container,
      style: MAP_STYLE,
      center: MUMBAI_CENTER,
      zoom: MUMBAI_DEFAULT_ZOOM,
      minZoom: MAHARASHTRA_MIN_ZOOM,
      maxZoom: MAHARASHTRA_MAX_ZOOM,
      maxBounds: MAHARASHTRA_MAX_BOUNDS,
      attributionControl: { compact: true },
    });

    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    const finishSetup = () => {
      if (cancelled || !mapRef.current) return;
      map.resize();
      map.fitBounds(MUMBAI_BOUNDS, {
        padding: 48,
        maxZoom: 11,
        duration: 0,
      });
      setReady(true);
    };

    if (map.loaded()) {
      finishSetup();
    } else {
      map.once("load", finishSetup);
    }
    map.once("style.load", finishSetup);

    map.on("click", (event: MapMouseEvent) => {
      const target = event.originalEvent.target as HTMLElement | null;
      if (target?.closest(".map-case-pin")) return;
      onSelectRef.current(null);
      setHover(null);
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      for (const marker of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const nextIds = new Set(cases.map((item) => item.case.id));

    for (const [caseId, marker] of markersRef.current.entries()) {
      if (!nextIds.has(caseId)) {
        marker.remove();
        markersRef.current.delete(caseId);
      }
    }

    for (const mapCase of cases) {
      const selected = mapCase.case.id === selectedCaseId;
      const existing = markersRef.current.get(mapCase.case.id);

      if (existing) {
        const el = existing.getElement() as HTMLButtonElement;
        el.classList.toggle("is-selected", selected);
        el.style.setProperty(
          "--pin-color",
          MARKER_STYLES[statusToMarkerKind(mapCase.case.status)].color,
        );
        existing.setLngLat([
          mapCase.establishment.longitude,
          mapCase.establishment.latitude,
        ]);
        continue;
      }

      const element = createPinElement(mapCase, selected);

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(mapCase.case.id);
      });

      element.addEventListener("mouseenter", () => {
        const point = map.project([
          mapCase.establishment.longitude,
          mapCase.establishment.latitude,
        ]);
        setHover({
          caseId: mapCase.case.id,
          x: point.x,
          y: point.y,
        });
      });

      element.addEventListener("mouseleave", () => {
        setHover((current) =>
          current?.caseId === mapCase.case.id ? null : current,
        );
      });

      const marker = new Marker({
        element,
        anchor: "center",
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([
          mapCase.establishment.longitude,
          mapCase.establishment.latitude,
        ])
        .addTo(map);

      markersRef.current.set(mapCase.case.id, marker);
    }
  }, [cases, selectedCaseId, ready]);

  const hoverCase = hover ? (casesById.get(hover.caseId) ?? null) : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--map-canvas)]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {hover && hoverCase && (
        <MarkerTooltip
          x={hover.x}
          y={hover.y}
          name={hoverCase.establishment.name}
          locality={
            hoverCase.establishment.locality ??
            hoverCase.establishment.city ??
            hoverCase.establishment.district
          }
          district={hoverCase.establishment.district}
          status={hoverCase.case.status}
          statusLabel={formatStatus(hoverCase.case.status)}
          dateLabel={formatMonthYear(
            hoverCase.case.action_date ?? hoverCase.case.inspection_date,
          )}
          accent={pinAccent(hoverCase.case.status).ink}
        />
      )}
    </div>
  );
}

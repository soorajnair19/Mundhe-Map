"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CommunityPlace, MapCase, MapLayer } from "@/lib/data/types";
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
  layer: MapLayer;
  cases: MapCase[];
  places: CommunityPlace[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface MapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locality: string;
  district: string;
  statusLabel: string;
  dateLabel: string;
  accent: string;
  variant: MapLayer;
  status?: string;
}

interface HoverState {
  pinId: string;
  x: number;
  y: number;
}

const COMMUNITY_PIN_COLOR = "#0f6e56";

const CASE_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" class="map-case-pin__icon" aria-hidden="true"><path d="M0 0h14v14H0z" fill="none"/><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.15"><path d="M13.48 7.516a6.5 6.5 0 1 1-6.93-7"/><path d="M9.79 8.09A3 3 0 1 1 5.9 4.21M7 7l2.5-2.5m2 .5l-2-.5l-.5-2l2-2l.5 2l2 .5z"/></g></svg>`;

const COMMUNITY_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" class="map-case-pin__icon" aria-hidden="true"><path d="M0 0h14v14H0z" fill="none"/><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.15"><path d="M3.25 1.75v10.5"/><path d="M3.25 2.2h7.1L8.4 5.15l1.95 2.95H3.25"/></g></svg>`;

function pinsFromCases(cases: MapCase[]): MapPin[] {
  return cases.map((mapCase) => {
    return {
      id: mapCase.case.id,
      name: mapCase.establishment.name,
      latitude: mapCase.establishment.latitude,
      longitude: mapCase.establishment.longitude,
      locality:
        mapCase.establishment.locality ??
        mapCase.establishment.city ??
        mapCase.establishment.district,
      district: mapCase.establishment.district,
      status: mapCase.case.status,
      statusLabel: formatStatus(mapCase.case.status),
      dateLabel: formatMonthYear(
        mapCase.case.action_date ?? mapCase.case.inspection_date,
      ),
      accent: pinAccent(mapCase.case.status).ink,
      variant: "enforcement",
    };
  });
}

function pinsFromPlaces(places: CommunityPlace[]): MapPin[] {
  return places.map((place) => ({
    id: place.id,
    name: place.place_name,
    latitude: place.latitude,
    longitude: place.longitude,
    locality: place.locality ?? place.city ?? place.district,
    district: place.district,
    statusLabel: "Community report",
    dateLabel: formatMonthYear(place.submitted_at),
    accent: COMMUNITY_PIN_COLOR,
    variant: "community",
  }));
}

function createPinElement(pin: MapPin, selected: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `map-case-pin${selected ? " is-selected" : ""}${
    pin.variant === "community" ? " is-community" : ""
  }`;
  button.style.setProperty(
    "--pin-color",
    pin.variant === "community"
      ? COMMUNITY_PIN_COLOR
      : MARKER_STYLES[statusToMarkerKind(pin.status ?? "other")].color,
  );
  button.setAttribute("aria-label", `${pin.name}, ${pin.statusLabel}`);
  button.innerHTML =
    pin.variant === "community" ? COMMUNITY_PIN_SVG : CASE_PIN_SVG;
  return button;
}

export function MapView({
  layer,
  cases,
  places,
  selectedId,
  onSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [ready, setReady] = useState(false);

  const pins = useMemo(
    () =>
      layer === "community" ? pinsFromPlaces(places) : pinsFromCases(cases),
    [layer, cases, places],
  );
  const pinsById = useMemo(
    () => new Map(pins.map((pin) => [pin.id, pin])),
    [pins],
  );

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

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

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      for (const marker of markers.values()) {
        marker.remove();
      }
      markers.clear();
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const nextIds = new Set(pins.map((pin) => pin.id));

    for (const [pinId, marker] of markersRef.current.entries()) {
      if (!nextIds.has(pinId)) {
        marker.remove();
        markersRef.current.delete(pinId);
      }
    }

    for (const pin of pins) {
      const selected = pin.id === selectedId;
      const existing = markersRef.current.get(pin.id);

      if (existing) {
        const el = existing.getElement() as HTMLButtonElement;
        el.classList.toggle("is-selected", selected);
        el.classList.toggle("is-community", pin.variant === "community");
        el.style.setProperty(
          "--pin-color",
          pin.variant === "community"
            ? COMMUNITY_PIN_COLOR
            : MARKER_STYLES[statusToMarkerKind(pin.status ?? "other")].color,
        );
        existing.setLngLat([pin.longitude, pin.latitude]);
        continue;
      }

      const element = createPinElement(pin, selected);

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(pin.id);
      });

      element.addEventListener("mouseenter", () => {
        const point = map.project([pin.longitude, pin.latitude]);
        setHover({
          pinId: pin.id,
          x: point.x,
          y: point.y,
        });
      });

      element.addEventListener("mouseleave", () => {
        setHover((current) => (current?.pinId === pin.id ? null : current));
      });

      const marker = new Marker({
        element,
        anchor: "center",
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);

      markersRef.current.set(pin.id, marker);
    }
  }, [pins, selectedId, ready]);

  useEffect(() => {
    if (!ready) return;
    setHover(null);
  }, [layer, ready]);

  const hoverPin = hover ? (pinsById.get(hover.pinId) ?? null) : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--map-canvas)]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {hover && hoverPin && (
        <MarkerTooltip
          x={hover.x}
          y={hover.y}
          name={hoverPin.name}
          locality={hoverPin.locality}
          district={hoverPin.district}
          status={hoverPin.status}
          statusLabel={hoverPin.statusLabel}
          dateLabel={hoverPin.dateLabel}
          accent={hoverPin.accent}
        />
      )}
    </div>
  );
}

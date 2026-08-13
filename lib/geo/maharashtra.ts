import type { StyleSpecification } from "maplibre-gl";

/** Approximate bounding box for Maharashtra (lng/lat). */
export const MAHARASHTRA_BOUNDS: [[number, number], [number, number]] = [
  [72.65, 15.6],
  [80.9, 22.1],
];

/** Hard pan limit — keeps the camera inside / near Maharashtra only. */
export const MAHARASHTRA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [71.8, 15.0],
  [81.6, 22.7],
];

export const MAHARASHTRA_CENTER: [number, number] = [75.85, 18.95];

export const MAHARASHTRA_DEFAULT_ZOOM = 6.35;

export const MAHARASHTRA_MIN_ZOOM = 5.8;

export const MAHARASHTRA_MAX_ZOOM = 14;

/**
 * Raster basemap (Carto light). Prefer this over vector style JSON for MapLibre v6,
 * where legacy vector style expressions can abort load and leave a blank canvas.
 */
export const MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "Carto Light Raster",
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-light",
      type: "raster",
      source: "carto-light",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

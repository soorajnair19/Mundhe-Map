import type { StyleSpecification } from "maplibre-gl";
import maharashtraBoundary from "@/data/geo/maharashtra.json";
import maharashtraMask from "@/data/geo/maharashtra-mask.json";

/** Approximate bounding box for Maharashtra (lng/lat). */
export const MAHARASHTRA_BOUNDS: [[number, number], [number, number]] = [
  [72.65, 15.6],
  [80.9, 22.1],
];

/** Hard pan limit — keeps the camera inside Maharashtra only. */
export const MAHARASHTRA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [72.4, 15.4],
  [81.1, 22.3],
];

export const MAHARASHTRA_CENTER: [number, number] = [75.85, 18.95];

export const MAHARASHTRA_DEFAULT_ZOOM = 6.35;

/** Greater Mumbai — island city + suburbs, where most cases sit. */
export const MUMBAI_BOUNDS: [[number, number], [number, number]] = [
  [72.77, 18.9],
  [73.02, 19.27],
];

export const MUMBAI_CENTER: [number, number] = [72.88, 19.08];

export const MUMBAI_DEFAULT_ZOOM = 10.4;

export const MAHARASHTRA_MIN_ZOOM = 5.8;

export const MAHARASHTRA_MAX_ZOOM = 14;

export type MapTheme = "light" | "dark";

const THEME_BASEMAP = {
  light: {
    path: "rastertiles/voyager",
    mask: "#fbf8f3",
    boundary: "#000000",
  },
  dark: {
    path: "dark_all",
    mask: "#0e0e0e",
    boundary: "#d8d8d8",
  },
} as const;

function cartoTiles(theme: MapTheme, cartoApiKey?: string): string[] {
  const key = cartoApiKey?.trim();
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const path = THEME_BASEMAP[theme].path;
  return ["a", "b", "c"].map(
    (sub) =>
      `https://${sub}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}@2x.png${suffix}`,
  );
}

/**
 * Raster basemap clipped to Maharashtra via an opaque mask + outline.
 * These layers live in the style so they appear on first paint.
 */
export function buildMapStyle(
  cartoApiKey?: string,
  theme: MapTheme = "light",
): StyleSpecification {
  const { mask, boundary } = THEME_BASEMAP[theme];
  return {
    version: 8,
    name: "Maharashtra only",
    sources: {
      "carto-basemap": {
        type: "raster",
        tiles: cartoTiles(theme, cartoApiKey),
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      "maharashtra-mask": {
        type: "geojson",
        data: maharashtraMask as GeoJSON.GeoJSON,
      },
      "maharashtra-boundary": {
        type: "geojson",
        data: maharashtraBoundary as GeoJSON.GeoJSON,
      },
    },
    layers: [
      {
        id: "carto-basemap",
        type: "raster",
        source: "carto-basemap",
        minzoom: 0,
        maxzoom: 20,
      },
      {
        id: "maharashtra-mask-fill",
        type: "fill",
        source: "maharashtra-mask",
        paint: {
          "fill-color": mask,
          "fill-opacity": 1,
        },
      },
      {
        id: "maharashtra-boundary-line",
        type: "line",
        source: "maharashtra-boundary",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": boundary,
          "line-width": 4,
          "line-opacity": 1,
        },
      },
    ],
  };
}

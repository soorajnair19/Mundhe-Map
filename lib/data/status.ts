import type { CaseStatus } from "@/lib/data/types";
import type { MapTheme } from "@/lib/geo/maharashtra";

export type MarkerKind =
  | "suspended"
  | "cancelled"
  | "sealed"
  | "notice"
  | "inspection"
  | "seizure"
  | "other";

export function statusToMarkerKind(status: CaseStatus | string): MarkerKind {
  switch (status) {
    case "licence_suspended":
      return "suspended";
    case "licence_cancelled":
      return "cancelled";
    case "sealed":
      return "sealed";
    case "notice_issued":
      return "notice";
    case "inspected":
      return "inspection";
    case "seizure":
      return "seizure";
    default:
      return "other";
  }
}

export const MARKER_STYLES: Record<
  MarkerKind,
  {
    color: string;
    shape: "circle" | "square" | "diamond" | "triangle";
    label: string;
    inLegend: boolean;
  }
> = {
  suspended: {
    color: "#E07020",
    shape: "square",
    label: "Licence suspended",
    inLegend: true,
  },
  cancelled: {
    color: "#8B1E1E",
    shape: "diamond",
    label: "Licence cancelled",
    inLegend: true,
  },
  sealed: { color: "#E11D2E", shape: "triangle", label: "Sealed", inLegend: true },
  notice: { color: "#895129", shape: "circle", label: "Notice", inLegend: true },
  inspection: {
    color: "#3D5A80",
    shape: "circle",
    label: "Inspection",
    inLegend: false,
  },
  seizure: { color: "#C11C84", shape: "square", label: "Seizure", inLegend: true },
  other: { color: "#5C6770", shape: "circle", label: "Other", inLegend: true },
};

export const COMMUNITY_PIN_COLOR = "#E0115F";
export const COMMUNITY_PIN_TINT = "#fce4ed";

const PANEL_LIGHT = "#ffffff";
const PANEL_DARK = "#1c211e";
const MIN_TEXT_CONTRAST = 4.5;

/** UI shades derived from a pin colour — hover labels, panel bars, links. */
export interface PinAccent {
  pin: string;
  ink: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function srgbChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbChannel(r) +
    0.7152 * srgbChannel(g) +
    0.0722 * srgbChannel(b)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

function lightenToContrast(
  hex: string,
  background: string,
  target: number,
): string {
  for (let step = 1; step <= 20; step += 1) {
    const candidate = lighten(hex, step / 20);
    if (contrastRatio(candidate, background) >= target) {
      return candidate;
    }
  }
  return "#ffffff";
}

function panelForTheme(theme: MapTheme): string {
  return theme === "dark" ? PANEL_DARK : PANEL_LIGHT;
}

function accentInk(pin: string, theme: MapTheme): string {
  if (theme === "dark") {
    return lightenToContrast(pin, panelForTheme(theme), MIN_TEXT_CONTRAST);
  }
  return darken(pin, 0.22);
}

export function markerAccent(
  kind: MarkerKind,
  theme: MapTheme = "light",
): PinAccent {
  const pin = MARKER_STYLES[kind].color;
  return { pin, ink: accentInk(pin, theme) };
}

export function pinAccent(
  status: CaseStatus | string,
  theme: MapTheme = "light",
): PinAccent {
  return markerAccent(statusToMarkerKind(status), theme);
}

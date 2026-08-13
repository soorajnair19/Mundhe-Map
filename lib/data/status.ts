import type { CaseStatus } from "@/lib/data/types";

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
  { color: string; shape: "circle" | "square" | "diamond" | "triangle"; label: string }
> = {
  suspended: { color: "#E07020", shape: "square", label: "Licence suspended" },
  cancelled: { color: "#8B1E1E", shape: "diamond", label: "Licence cancelled" },
  sealed: { color: "#1F3A5F", shape: "triangle", label: "Sealed" },
  notice: { color: "#A15C07", shape: "circle", label: "Notice" },
  inspection: { color: "#3D5A80", shape: "circle", label: "Inspection" },
  seizure: { color: "#5C4B8A", shape: "square", label: "Seizure" },
  other: { color: "#5C6770", shape: "circle", label: "Other" },
};

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

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function pinAccent(status: CaseStatus | string): PinAccent {
  const pin = MARKER_STYLES[statusToMarkerKind(status)].color;
  return {
    pin,
    ink: darken(pin, 0.22),
  };
}

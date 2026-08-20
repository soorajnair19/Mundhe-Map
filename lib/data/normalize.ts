const SUFFIXES = [
  /\band\b/g,
  /\bco\b/g,
  /\bcompany\b/g,
  /\bpvt\b/g,
  /\bltd\b/g,
  /\bprivate\b/g,
  /\blimited\b/g,
  /\bhotel\b/g,
  /\brestaurant\b/g,
];

export function normalizeName(name: string): string {
  let value = name.toLowerCase().trim();
  value = value.replace(/[.&'’",()/\\-]/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  for (const suffix of SUFFIXES) {
    value = value.replace(suffix, " ");
  }
  return value.replace(/\s+/g, " ").trim();
}

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Join location fields, skipping blanks and exact duplicates (city copied into district). */
export function formatLocationParts(
  parts: Array<string | null | undefined>,
  separator = ", ",
): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique.join(separator);
}

export function formatStatus(status: string): string {
  return formatLabel(status).toUpperCase();
}

export function formatMonthYear(isoDate: string | null): string {
  if (!isoDate) return "Date unknown";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date unknown";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDisplayDateTime(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

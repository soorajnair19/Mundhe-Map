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

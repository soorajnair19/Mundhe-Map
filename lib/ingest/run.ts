import { getAllMapCases } from "@/lib/data/load";
import { normalizeName } from "@/lib/data/normalize";
import type { FDAReport } from "@/lib/admin/types";
import { isEnforcementCandidate, reportFromRssItem, storyClusterKey } from "@/lib/ingest/extract";
import { fetchRssFeed, type RssItem } from "@/lib/ingest/rss";
import { ingestFeeds } from "@/lib/ingest/sources";

export interface BuiltIngest {
  fetched: number;
  candidates: number;
  reports: FDAReport[];
  skipped: number;
  errors: string[];
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function placeKey(name: string, city: string | null): string {
  return `${normalizeName(name)}|${normalizeName(city ?? "")}`;
}

export function existingFdaKeys(reports: FDAReport[]): {
  urls: Set<string>;
  places: Set<string>;
} {
  const urls = new Set<string>();
  const places = new Set<string>();
  for (const report of reports) {
    places.add(placeKey(report.establishment.name, report.establishment.city));
    for (const source of report.case.sources) {
      urls.add(normalizeUrl(source.url));
    }
  }
  for (const item of getAllMapCases()) {
    places.add(placeKey(item.establishment.name, item.establishment.city));
    for (const source of item.case.sources) {
      urls.add(normalizeUrl(source.url));
    }
  }
  return { urls, places };
}

export function isDuplicateReport(
  report: FDAReport,
  keys: { urls: Set<string>; places: Set<string> },
): boolean {
  if (keys.places.has(placeKey(report.establishment.name, report.establishment.city))) {
    return true;
  }
  return report.case.sources.some((source) => keys.urls.has(normalizeUrl(source.url)));
}

async function collectItems(lookbackDays: number): Promise<{
  items: RssItem[];
  errors: string[];
}> {
  const errors: string[] = [];
  const seen = new Set<string>();
  const items: RssItem[] = [];

  for (const feed of ingestFeeds(lookbackDays)) {
    try {
      const fetched = await fetchRssFeed(feed.url, feed.name);
      for (const item of fetched) {
        const key = normalizeUrl(item.url) || item.title;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(item);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { items, errors };
}

export function reportsFromItems(
  items: RssItem[],
  existing: FDAReport[],
  nowIso = new Date().toISOString(),
): { candidates: number; reports: FDAReport[] } {
  const keys = existingFdaKeys(existing);
  const reports: FDAReport[] = [];
  const usedIds = new Set(existing.map((report) => report.id));
  const clusters = new Set(
    existing.map((report) =>
      storyClusterKey(report.establishment.name),
    ),
  );
  let candidates = 0;

  for (const item of items) {
    if (!isEnforcementCandidate(item)) continue;
    candidates += 1;
    const report = reportFromRssItem(item, nowIso);
    const cluster = storyClusterKey(
      `${item.title} ${report.establishment.name}`,
    );
    if (
      isDuplicateReport(report, keys) ||
      usedIds.has(report.id) ||
      clusters.has(cluster)
    ) {
      continue;
    }
    reports.push(report);
    usedIds.add(report.id);
    clusters.add(cluster);
    keys.urls.add(normalizeUrl(item.url));
    keys.places.add(placeKey(report.establishment.name, report.establishment.city));
  }

  return { candidates, reports };
}

export async function buildFdaIngestReports(
  lookbackDays: number,
  existing: FDAReport[],
): Promise<BuiltIngest> {
  const { items, errors } = await collectItems(lookbackDays);
  const { candidates, reports } = reportsFromItems(items, existing);
  return {
    fetched: items.length,
    candidates,
    reports,
    skipped: Math.max(0, candidates - reports.length),
    errors,
  };
}

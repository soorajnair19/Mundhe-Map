import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeName } from "../lib/data/normalize";
import {
  extractEstablishmentName,
} from "../lib/ingest/extract";
import type { FDAReport } from "../lib/admin/types";

const LEDGER = path.join(
  process.cwd(),
  "data/admin/pending-fda-reports.json",
);

function sourceTitle(report: FDAReport): string {
  return report.case.sources[0]?.title || report.case.summary || "";
}

function mapsUrl(name: string, city: string | null): string {
  const query = encodeURIComponent(
    [name, city, "Maharashtra"].filter(Boolean).join(" "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function shouldReplace(current: string, extracted: string): boolean {
  return current !== extracted;
}

async function main() {
  const reports = JSON.parse(await readFile(LEDGER, "utf8")) as FDAReport[];
  let updated = 0;

  for (const report of reports) {
    const title = sourceTitle(report);
    if (!title) continue;
    if (
      report.establishment.address ||
      report.establishment.locality ||
      (report.case.confidence_score ?? 0) >= 0.7
    ) {
      continue;
    }
    const extracted = extractEstablishmentName(
      title,
      report.case.summary,
      report.establishment.city,
    );
    const current = report.establishment.name;
    if (!shouldReplace(current, extracted.name)) continue;

    report.establishment.name = extracted.name;
    report.establishment.normalized_name = normalizeName(extracted.name);
    report.establishment.maps_url = mapsUrl(
      extracted.name,
      report.establishment.city,
    );
    updated += 1;
    console.log(`${current}\n  -> ${extracted.name} (${extracted.kind})`);
  }

  await writeFile(LEDGER, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
  console.log(`\nUpdated ${updated} of ${reports.length} reports`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

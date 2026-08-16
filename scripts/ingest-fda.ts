import { loadFdaLedger, saveFdaLedger } from "../lib/admin/persist";
import { buildFdaIngestReports } from "../lib/ingest/run";

function lookbackDays(): number {
  const flag = process.argv.find((arg) => arg.startsWith("--lookback-days="));
  const fromFlag = flag ? Number(flag.slice("--lookback-days=".length)) : NaN;
  const fromEnv = Number(process.env.INGEST_LOOKBACK_DAYS);
  if (Number.isFinite(fromFlag) && fromFlag > 0) return fromFlag;
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return 2;
}

async function main() {
  const days = lookbackDays();
  const ledger = await loadFdaLedger();
  const built = await buildFdaIngestReports(days, ledger.reports);
  const nextReports = [...built.reports, ...ledger.reports];
  if (built.reports.length > 0) {
    await saveFdaLedger(nextReports, ledger.sha);
  }

  console.log(
    JSON.stringify(
      {
        lookbackDays: days,
        fetched: built.fetched,
        candidates: built.candidates,
        added: built.reports.length,
        skipped: built.skipped,
        errors: built.errors,
        addedIds: built.reports.map((report) => report.id),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import {
  loadCommunityLedger,
  loadFdaLedger,
  saveCommunityLedger,
  saveFdaLedger,
} from "../lib/admin/persist";
import type { CommunityRequest } from "../lib/admin/types";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Set it in the environment before running this test.`);
  }
  return value;
}

async function testCommunityLedgerRoundTrip(): Promise<void> {
  const ledger = await loadCommunityLedger();
  const marker = `req-ledger-test-${Date.now().toString(36)}`;
  const testRequest: CommunityRequest = {
    id: marker,
    status: "pending",
    place_name: "Ledger connectivity test",
    maps_url: "https://www.google.com/maps/search/?api=1&query=Pune+Maharashtra",
    plus_code: null,
    address: null,
    locality: "Test locality",
    city: "Pune",
    district: "Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    concern: "Automated GitHub ledger write test — safe to delete.",
    evidence: [],
    submitted_at: new Date().toISOString(),
    submitter: null,
    similar_report_count: 1,
    rejection_reason: null,
    rejection_notes: null,
    duplicate_of_place: null,
    published_place_id: null,
  };

  const withTest = [testRequest, ...ledger.requests];
  await saveCommunityLedger(withTest, ledger.sha);

  const reloaded = await loadCommunityLedger();
  const found = reloaded.requests.some((request) => request.id === marker);
  if (!found) {
    throw new Error("Community ledger write succeeded but the test row was not found on reload.");
  }

  const cleaned = reloaded.requests.filter((request) => request.id !== marker);
  await saveCommunityLedger(cleaned, reloaded.sha);
}

async function main() {
  process.env.VERCEL = "1";
  requireEnv("FDA_GITHUB_TOKEN");
  requireEnv("FDA_GITHUB_REPO");

  const repo = process.env.FDA_GITHUB_REPO;
  const branch = process.env.FDA_GITHUB_BRANCH ?? "main";

  console.log(`Testing GitHub ledger access for ${repo}@${branch} (VERCEL=1)...`);

  const fda = await loadFdaLedger();
  console.log(`FDA ledger read OK (${fda.reports.length} rows, sha=${fda.sha?.slice(0, 7) ?? "none"})`);

  const community = await loadCommunityLedger();
  console.log(
    `Community ledger read OK (${community.requests.length} rows, sha=${community.sha?.slice(0, 7) ?? "none"})`,
  );

  await testCommunityLedgerRoundTrip();
  console.log("Community ledger write round-trip OK (test row added then removed).");

  await saveFdaLedger(fda.reports, fda.sha);
  console.log("FDA ledger rewrite OK (no data changes).");

  console.log("All GitHub ledger checks passed.");
}

main().catch((error) => {
  console.error("GitHub ledger test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

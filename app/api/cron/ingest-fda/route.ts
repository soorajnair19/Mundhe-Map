import type { NextRequest } from "next/server";
import { persistMessageSafe } from "@/lib/admin/persist";
import {
  enqueueFDAReports,
  getFDAReports,
  hydrateAdminStore,
} from "@/lib/admin/store";
import { buildFdaIngestReports } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lookbackDays = Number(
    request.nextUrl.searchParams.get("lookback_days") ??
      process.env.INGEST_LOOKBACK_DAYS ??
      2,
  );

  try {
    await hydrateAdminStore();
    const built = await buildFdaIngestReports(
      Number.isFinite(lookbackDays) ? lookbackDays : 2,
      getFDAReports("all"),
    );
    const added = await enqueueFDAReports(built.reports);
    return Response.json({
      fetched: built.fetched,
      candidates: built.candidates,
      added: added.length,
      skipped: built.skipped,
      errors: built.errors,
    });
  } catch (error) {
    return Response.json(
      { error: persistMessageSafe(error) },
      { status: 500 },
    );
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  attemptAdminLogin,
  assertAdmin,
  clearAdminSession,
} from "@/lib/admin/auth";
import * as store from "@/lib/admin/store";
import { persistMessageSafe } from "@/lib/admin/persist";
import { buildFdaIngestReports } from "@/lib/ingest/run";
import type { EnforcementCase, Establishment } from "@/lib/data/types";
import type { RejectionReason } from "@/lib/admin/types";

function refreshAdmin(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/fda-reports");
  revalidatePath("/admin/community-requests");
}

function persistMessage(error: unknown): string {
  return persistMessageSafe(error);
}

export async function loginAdmin(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const pin = String(formData.get("pin") ?? "").trim();
  const result = await attemptAdminLogin(pin);
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/admin/fda-reports");
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession();
  redirect("/admin");
}

export async function approveFDAReportAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.approveFDAReport(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function rejectFDAReportAction(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.rejectFDAReport(id, reason, notes);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function markFDAReportDuplicateAction(
  id: string,
  duplicateOfCaseId: string | null,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.markFDAReportDuplicate(id, duplicateOfCaseId);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function updateFDAReportAction(
  id: string,
  patch: { establishment: Establishment; case: EnforcementCase },
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.updateFDAReport(id, patch);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function unpublishFDAReportAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.unpublishFDAReport(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function restoreFDAReportAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.restoreFDAReport(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function ingestFdaReportsAction(
  lookbackDays = 2,
): Promise<{ error: string | null; added: number; skipped: number; fetched: number }> {
  await assertAdmin();
  try {
    await store.hydrateAdminStore();
    const built = await buildFdaIngestReports(
      lookbackDays,
      store.getFDAReports("all"),
    );
    const added = await store.enqueueFDAReports(built.reports);
    refreshAdmin();
    const warning = built.errors.length
      ? `Some feeds failed: ${built.errors.join(" · ")}`
      : null;
    return {
      error: warning,
      added: added.length,
      skipped: built.skipped,
      fetched: built.fetched,
    };
  } catch (error) {
    return {
      error: persistMessage(error),
      added: 0,
      skipped: 0,
      fetched: 0,
    };
  }
}

export async function approveCommunityRequestAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.approveCommunityRequest(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function rejectCommunityRequestAction(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.rejectCommunityRequest(id, reason, notes);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function unpublishCommunityRequestAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.unpublishCommunityRequest(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function restoreCommunityRequestAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.restoreCommunityRequest(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function markCommunityRequestDuplicateAction(
  id: string,
  duplicateOfPlace: string | null,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.markCommunityRequestDuplicate(id, duplicateOfPlace);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function investigateCommunityRequestAction(
  id: string,
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.investigateCommunityRequest(id);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

export async function updateCommunityRequestAction(
  id: string,
  patch: {
    place_name: string;
    maps_url: string;
    plus_code: string | null;
    address: string | null;
    locality: string | null;
    city: string | null;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
    concern: string;
  },
): Promise<{ error: string | null }> {
  await assertAdmin();
  try {
    await store.updateCommunityRequest(id, patch);
    refreshAdmin();
    return { error: null };
  } catch (error) {
    return { error: persistMessage(error) };
  }
}

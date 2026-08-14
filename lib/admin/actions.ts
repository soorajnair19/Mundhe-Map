"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  attemptAdminLogin,
  assertAdmin,
  clearAdminSession,
} from "@/lib/admin/auth";
import * as store from "@/lib/admin/store";
import type { EnforcementCase, Establishment } from "@/lib/data/types";
import type { RejectionReason } from "@/lib/admin/types";

function refreshAdmin(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/fda-reports");
  revalidatePath("/admin/community-requests");
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

export async function approveFDAReportAction(id: string): Promise<void> {
  await assertAdmin();
  store.approveFDAReport(id);
  refreshAdmin();
}

export async function rejectFDAReportAction(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): Promise<void> {
  await assertAdmin();
  store.rejectFDAReport(id, reason, notes);
  refreshAdmin();
}

export async function markFDAReportDuplicateAction(
  id: string,
  duplicateOfCaseId: string | null,
): Promise<void> {
  await assertAdmin();
  store.markFDAReportDuplicate(id, duplicateOfCaseId);
  refreshAdmin();
}

export async function updateFDAReportAction(
  id: string,
  patch: { establishment: Establishment; case: EnforcementCase },
): Promise<void> {
  await assertAdmin();
  store.updateFDAReport(id, patch);
  refreshAdmin();
}

export async function approveCommunityRequestAction(id: string): Promise<void> {
  await assertAdmin();
  store.approveCommunityRequest(id);
  refreshAdmin();
}

export async function rejectCommunityRequestAction(
  id: string,
  reason: RejectionReason | null,
  notes: string | null,
): Promise<void> {
  await assertAdmin();
  store.rejectCommunityRequest(id, reason, notes);
  refreshAdmin();
}

export async function markCommunityRequestDuplicateAction(
  id: string,
  duplicateOfPlace: string | null,
): Promise<void> {
  await assertAdmin();
  store.markCommunityRequestDuplicate(id, duplicateOfPlace);
  refreshAdmin();
}

export async function investigateCommunityRequestAction(
  id: string,
): Promise<void> {
  await assertAdmin();
  store.investigateCommunityRequest(id);
  refreshAdmin();
}

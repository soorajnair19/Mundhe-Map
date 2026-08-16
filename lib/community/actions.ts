"use server";

import { revalidatePath } from "next/cache";
import { getClientIp } from "@/lib/admin/auth";
import { isSubmitLocked, recordSubmit } from "@/lib/admin/rate-limit";
import { createCommunityRequest } from "@/lib/admin/store";
import { parseCommunityRequestForm } from "@/lib/community/parse-form";

export async function submitCommunityRequestAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  const ip = await getClientIp();
  if (isSubmitLocked(ip)) {
    return {
      error: "Too many reports from this network. Try again later.",
      ok: false,
    };
  }

  const parsed = await parseCommunityRequestForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, ok: false };
  }

  recordSubmit(ip);
  createCommunityRequest(parsed.draft);
  revalidatePath("/admin");
  revalidatePath("/admin/community-requests");
  return { error: null, ok: true };
}

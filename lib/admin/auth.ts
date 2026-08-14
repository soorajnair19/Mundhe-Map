import { cookies, headers } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  pinsMatch,
  verifySessionToken,
} from "@/lib/admin/session";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "@/lib/admin/rate-limit";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return requestHeaders.get("x-real-ip") ?? "unknown";
}

export async function attemptAdminLogin(
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  if (isLoginLocked(ip)) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const expected = process.env.ADMIN_PIN ?? "";
  if (!pinsMatch(pin, expected)) {
    recordLoginFailure(ip);
    return { ok: false, error: "Could not sign in." };
  }

  if (!process.env.ADMIN_SESSION_SECRET) {
    return { ok: false, error: "Could not sign in." };
  }

  clearLoginFailures(ip);
  const token = await createSessionToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return { ok: true };
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

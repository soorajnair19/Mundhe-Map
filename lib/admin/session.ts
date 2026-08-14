export const ADMIN_COOKIE_NAME = "mundhe_admin";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSha256(message: string): Promise<Uint8Array> {
  const secret = getSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(signature);
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = String(exp);
  const signature = toBase64Url(await hmacSha256(payload));
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !getSecret()) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  let provided: Uint8Array;
  try {
    provided = fromBase64Url(signature);
  } catch {
    return false;
  }
  const expected = await hmacSha256(payload);
  return timingSafeEqualBytes(provided, expected);
}

export function pinsMatch(pin: string, expected: string): boolean {
  if (!/^\d{4}$/.test(pin) || !/^\d{4}$/.test(expected)) return false;
  const a = new TextEncoder().encode(pin);
  const b = new TextEncoder().encode(expected);
  return timingSafeEqualBytes(a, b);
}

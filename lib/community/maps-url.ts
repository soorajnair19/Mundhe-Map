const SHORT_MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
  "maps.google.com",
]);

const MAPS_HOST_SUFFIXES = [
  "google.com",
  "google.co.in",
  "goo.gl",
  "g.co",
  "maps.app.goo.gl",
];

export function isGoogleMapsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return MAPS_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export function isShortGoogleMapsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SHORT_MAPS_HOSTS.has(host);
  } catch {
    return false;
  }
}

export async function expandGoogleMapsUrl(
  url: string,
  timeoutMs = 8000,
): Promise<string> {
  if (!isShortGoogleMapsUrl(url)) return url;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "MundheMap/0.1 (community location resolve)",
      },
    });
    return response.url || url;
  } catch {
    return url;
  } finally {
    clearTimeout(timer);
  }
}

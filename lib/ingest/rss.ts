export interface RssItem {
  title: string;
  url: string;
  publishedAt: string | null;
  sourceName: string;
  snippet: string;
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function stripHtml(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function firstHref(html: string): string | null {
  const match = html.match(/href=["']([^"']+)["']/i);
  return match ? decodeEntities(match[1]) : null;
}

function sourceFromTitle(title: string, fallback: string): { title: string; sourceName: string } {
  const split = title.match(/^(.*)\s[-–—]\s+(.+)$/);
  if (split) {
    return { title: split[1].trim(), sourceName: split[2].trim() };
  }
  return { title, sourceName: fallback };
}

function toIsoDate(raw: string): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseItems(xml: string, feedName: string): RssItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const items: RssItem[] = [];

  for (const block of blocks) {
    const rawTitle = tagValue(block, "title");
    if (!rawTitle) continue;
    const { title, sourceName } = sourceFromTitle(rawTitle, feedName);
    const sourceTag = block.match(
      /<source[^>]*url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i,
    );
    const namedSource = sourceTag ? decodeEntities(sourceTag[2]) : sourceName;
    const description = tagValue(block, "description");
    const link = tagValue(block, "link") || firstHref(description) || "";
    const articleUrl = firstHref(description) || link;
    if (!articleUrl) continue;

    items.push({
      title,
      url: articleUrl,
      publishedAt: toIsoDate(tagValue(block, "pubDate") || tagValue(block, "dc:date")),
      sourceName: namedSource || feedName,
      snippet: stripHtml(description).slice(0, 600),
    });
  }

  return items;
}

export async function fetchRssFeed(
  url: string,
  feedName: string,
): Promise<RssItem[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MundheMap/0.1 (FDA news ingest; local map of public reports)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`RSS fetch failed (${response.status}) for ${feedName}`);
  }
  const xml = await response.text();
  return parseItems(xml, feedName);
}

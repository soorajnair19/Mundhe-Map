export interface RssFeed {
  name: string;
  url: string;
}

const GOOGLE_NEWS_QUERIES = [
  "Maharashtra FDA licence OR license suspended",
  "Maharashtra FDA raid OR seizure OR sealed",
  "Mumbai FDA FSSAI suspend OR hygiene",
  "Pune FDA licence OR raid",
  "Nashik FDA licence OR seizure",
];

function googleNewsRss(query: string, lookbackDays: number): string {
  const windowed = `${query} when:${Math.max(1, lookbackDays)}d`;
  const params = new URLSearchParams({
    q: windowed,
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

export function ingestFeeds(lookbackDays: number): RssFeed[] {
  return [
    ...GOOGLE_NEWS_QUERIES.map((query) => ({
      name: "Google News",
      url: googleNewsRss(query, lookbackDays),
    })),
    {
      name: "The Indian Express",
      url: "https://indianexpress.com/section/cities/mumbai/feed/",
    },
    {
      name: "The Indian Express",
      url: "https://indianexpress.com/section/cities/pune/feed/",
    },
    {
      name: "Times of India",
      url: "https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms",
    },
  ];
}

// Reads one configured source into raw items. Each kind is one API or feed format.
import { parseFeed } from "feedsmith";
import type { Source } from "../../readery.config.ts";

export type Raw = { source: string; url: string; title: string; description?: string; publishedAt?: string; via?: string };

const UA = { "user-agent": "readery/0.1 (+https://github.com/oyobbeb/readery)" };
const DAY = 86_400_000;

export async function get(url: string, ms = 20_000) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== "#") return NAMED[e.toLowerCase()] ?? m;
    const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
  });

// Feed text is HTML; keep one plain line.
export function plain(s = "", max = 600) {
  const t = decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function parseAnyFeed(text: string, base: string, source: string): Raw[] {
  const { format, feed } = parseFeed(text) as { format: string; feed: any };
  const entries: any[] = feed.items ?? feed.entries ?? [];
  return entries.flatMap((e) => {
    const link =
      format === "atom" ? (e.links?.find((l: any) => !l.rel || l.rel === "alternate") ?? e.links?.[0])?.href ?? e.id
      : format === "json" ? e.url
      : e.link ?? e.guid?.value;
    const title = plain(e.title ?? "", 300);
    if (!link || !title) return [];
    const body = e.description ?? e.summary ?? e.content?.encoded ?? e.content_html ?? (typeof e.content === "string" ? e.content : "");
    return [{ source, url: new URL(link, base).href, title, description: plain(body) || undefined, publishedAt: e.pubDate ?? e.published ?? e.updated ?? e.date_published ?? e.dc?.date }];
  });
}

export async function fetchSource(s: Source): Promise<Raw[]> {
  switch (s.kind) {
    case "hn": {
      // Stories past 100 points in the last two days; hourly runs catch each one while it is hot.
      const since = Math.floor((Date.now() - 2 * DAY) / 1000);
      const { hits } = JSON.parse(await get(`https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points%3E100,created_at_i%3E${since}&hitsPerPage=100`));
      return hits.map((h: any) => {
        const via = `https://news.ycombinator.com/item?id=${h.objectID}`;
        return { source: s.id, title: h.title, url: h.url || via, via, description: plain(h.story_text ?? "") || undefined, publishedAt: h.created_at };
      });
    }
    case "lobsters": {
      const list = JSON.parse(await get("https://lobste.rs/hottest.json"));
      return list.map((p: any) => ({ source: s.id, title: p.title, url: p.url || p.comments_url, via: p.comments_url, description: plain(p.description_plain ?? p.description ?? "") || undefined, publishedAt: p.created_at }));
    }
    case "toss": {
      const { success } = JSON.parse(await get("https://api-public.toss.im/api-public/v3/ipd-thor/api/v1/workspaces/15/posts?page=1&size=20"));
      return success.results.map((p: any) => ({ source: s.id, title: p.title, url: `https://toss.tech/article/${p.key}`, description: plain([p.subtitle, p.seoConfig?.description].filter(Boolean).join(" — ")) || undefined, publishedAt: p.publishedTime }));
    }
    case "geeknews": {
      // Entries point at GeekNews topic pages; collect swaps in the article URL (geekNewsTarget) for new topics.
      const url = "https://news.hada.io/rss/news";
      return parseAnyFeed(await get(url), url, s.id).map((r) => ({ ...r, via: r.url }));
    }
    case "feed":
      return parseAnyFeed(await get(s.url), s.url, s.id).filter((r) => !s.pathPrefix || new URL(r.url).pathname.startsWith(s.pathPrefix));
  }
}

// The article a GeekNews topic links to; Ask/Show GN topics link to themselves.
export async function geekNewsTarget(topicUrl: string) {
  const href = (await get(topicUrl)).match(/<a href='([^']+)' class='[^']*topic-title-link/)?.[1];
  return href && /^https?:\/\//.test(href) && !href.includes("news.hada.io") ? href : topicUrl;
}

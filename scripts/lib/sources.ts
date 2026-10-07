// Reads one configured source into raw items. Each kind is one API or feed format.
import { parseFeed } from "feedsmith";
import type { Source } from "../../readery.config.ts";

export type Raw = { source: string; url: string; title: string; description?: string; publishedAt?: string; via?: string };

const UA = { "user-agent": "readery/0.1 (+https://github.com/oyobbeb/readery)" };
const DAY = 86_400_000;

// At most 8 requests in flight, and one retry on a network error: 65 at once made some fail with
// "fetch failed" on a home network. HTTP errors and timeouts are not retried.
let inFlight = 0;
const waiting: (() => void)[] = [];
export async function get(url: string, ms = 20_000, headers: Record<string, string> = {}) {
  while (inFlight >= 8) await new Promise<void>((r) => waiting.push(r));
  inFlight++;
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(ms) });
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return await res.text();
      } catch (e) {
        if (attempt >= 2 || !(e instanceof TypeError)) throw e;
      }
    }
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

// GitHub's REST API: 60 requests/hour without a token, 1,000 with the Actions GITHUB_TOKEN.
const github = async (path: string) =>
  JSON.parse(await get(`https://api.github.com/${path}`, 20_000, process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}));

// One lookup per commit per run: several docs sources watch folders of the same repo.
const commits = new Map<string, Promise<any>>();
const commitDetail = (repo: string, sha: string) => {
  if (!commits.has(sha)) commits.set(sha, github(`repos/${repo}/commits/${sha}`));
  return commits.get(sha)!;
};

// "x.y.0" for a stable minor or major release title, undefined for patches and pre-releases.
export function stableVersion(title: string) {
  if (/\b(canary|alpha|beta|rc|nightly|preview|experimental|insiders)\b/i.test(title)) return undefined;
  const m = title.match(/(\d+)\.(\d+)(?:\.(\d+))?(?![-.\w])/);
  return m && (m[3] ?? "0") === "0" ? `${m[1]}.${m[2]}.0` : undefined;
}

// Docs file → page path: "04-functions/after.mdx" → "functions/after".
export const docsPage = (file: string) => file.replace(/\.mdx?$/, "").replace(/(^|\/)\d+-/g, "$1");

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
    case "release": {
      const url = `https://github.com/${s.repo}/releases.atom`;
      return parseAnyFeed(await get(url), url, s.id).flatMap((r) => {
        const version = (!s.title || s.title.test(r.title)) && stableVersion(r.title);
        return version ? [{ ...r, title: `${s.name} ${version}` }] : [];
      });
    }
    case "docs": {
      // Pages added under the reference path in the last two days; hourly runs overlap and dedupe keeps one item.
      // ponytail: an outage longer than two days misses pages; widen `since` if Actions ever stalls that long.
      const since = new Date(Date.now() - 2 * DAY).toISOString();
      const commits: any[] = await github(`repos/${s.repo}/commits?path=${encodeURIComponent(s.path)}&since=${since}&per_page=30`);
      const out: Raw[] = [];
      for (const c of commits) {
        const { files } = await commitDetail(s.repo, c.sha);
        for (const f of files as any[]) {
          if (f.status !== "added" || !f.filename.startsWith(`${s.path}/`) || !/\.mdx?$/.test(f.filename)) continue;
          const page = docsPage(f.filename.slice(s.path.length + 1));
          if (!page.endsWith("index")) out.push({ source: s.id, title: `${s.name} docs: new page ${page}`, url: s.url + page, publishedAt: c.commit.committer.date });
        }
      }
      return out;
    }
  }
}

// The article a GeekNews topic links to; Ask/Show GN topics link to themselves.
export async function geekNewsTarget(topicUrl: string) {
  const href = (await get(topicUrl)).match(/<a href='([^']+)' class='[^']*topic-title-link/)?.[1];
  return href && /^https?:\/\//.test(href) && !href.includes("news.hada.io") ? href : topicUrl;
}

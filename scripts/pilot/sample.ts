// Builds the pilot label set: 50 English + 50 Korean items from live feeds, half of each
// source drawn from keyword hits so the set carries enough positives (≥30) to tune thresholds.
// Run once; labels point at these ids, so an existing file is never overwritten without --force.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { keywordHit, type Profile } from "../lib/llm/judgments.ts";

const OUT = "data/labels/pilot-items.json";
if (existsSync(OUT) && !process.argv.includes("--force")) {
  console.error(`${OUT} exists and labels may point at it. Re-run with --force to resample.`);
  process.exit(1);
}
const profile: Profile = JSON.parse(readFileSync("data/labels/profile.json", "utf8"));

type Raw = { source: string; title: string; url: string; description?: string; tags?: string[]; publishedAt?: string };
type Item = Raw & { id: string; lang: "ko" | "en"; site: string; descFrom?: "feed" | "og"; keywordHit: boolean };

const UA = { "User-Agent": "readery-pilot/0.1 (personal feed reader)" };
const get = async (url: string, ms = 15_000) => {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const clean = (s = "") =>
  decode(decode(s.replace(/<!\[CDATA\[|\]\]>/g, "")).replace(/<[^>]+>/g, " "))
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
const clip = (s: string, n = 600) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function parseFeed(xml: string, source: string): Raw[] {
  return (xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? []).map((b) => {
    const tag = (name: string) => b.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1];
    const link = b.match(/<link[^>]*href=["']([^"']+)["']/)?.[1] ?? tag("link");
    const body = tag("description") ?? tag("summary") ?? tag("content:encoded") ?? tag("content");
    return { source, title: clean(tag("title")), url: clean(link), description: clip(clean(body)), publishedAt: tag("pubDate") ?? tag("published") ?? tag("updated") };
  });
}

async function hackerNews(): Promise<Raw[]> {
  const since = Math.floor(Date.now() / 1000) - 3 * 86_400;
  const json = JSON.parse(await get(`https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points%3E100,created_at_i%3E${since}&hitsPerPage=150`));
  return json.hits.map((h: any) => ({
    source: "Hacker News",
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    description: h.story_text ? clip(clean(h.story_text)) : undefined,
    publishedAt: h.created_at,
  }));
}

async function lobsters(): Promise<Raw[]> {
  const lists = await Promise.all(["hottest", "newest"].map(async (p) => JSON.parse(await get(`https://lobste.rs/${p}.json`))));
  return lists.flat().map((s: any) => ({
    source: "Lobsters",
    title: s.title,
    url: s.url || s.comments_url,
    description: s.description ? clip(clean(s.description)) : undefined,
    tags: s.tags,
    publishedAt: s.created_at,
  }));
}

async function tossTech(): Promise<Raw[]> {
  const json = JSON.parse(await get("https://api-public.toss.im/api-public/v3/ipd-thor/api/v1/workspaces/15/posts?page=1&size=20"));
  return json.success.results.map((p: any) => ({
    source: "Toss Tech",
    title: p.title,
    url: `https://toss.tech/article/${p.key}`,
    description: clip(clean([p.subtitle, p.seoConfig?.description].filter(Boolean).join(" — "))),
    publishedAt: p.publishedTime,
  }));
}

const KO_FEEDS: Record<string, string> = {
  GeekNews: "https://news.hada.io/rss/news",
  "LINE Tech": "https://techblog.lycorp.co.jp/ko/feed/index.xml",
  "NAVER D2": "https://d2.naver.com/d2.atom",
  "Kakao Tech": "https://tech.kakao.com/feed/",
  "Woowahan Tech": "https://techblog.woowahan.com/feed/",
  "Daangn Tech": "https://medium.com/feed/daangn",
};
// Per-source quotas: 50 English, 50 Korean.
const QUOTA: Record<string, number> = {
  "Hacker News": 30, Lobsters: 20,
  GeekNews: 25, "Toss Tech": 6, "LINE Tech": 6, "NAVER D2": 4, "Kakao Tech": 3, "Woowahan Tech": 3, "Daangn Tech": 3,
};

async function ogDescription(url: string) {
  try {
    const html = await get(url, 4_000);
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*>/i)?.[0];
    const content = m?.match(/content=["']([^"']*)["']/i)?.[1];
    return content ? clip(clean(content), 400) : undefined;
  } catch {
    return undefined;
  }
}

// Deterministic shuffle so a re-run over the same pool picks the same items.
function shuffle<T>(arr: T[], seed: number) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s + 0x6d2b79f5) >>> 0), (((s ^ (s >>> 15)) * (1 | s)) >>> 0) / 2 ** 32);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const settled = await Promise.allSettled([
  hackerNews(),
  lobsters(),
  tossTech(),
  ...Object.entries(KO_FEEDS).map(async ([source, url]) => parseFeed(await get(url), source)),
]);
settled.forEach((r) => r.status === "rejected" && console.warn("source failed:", String(r.reason).slice(0, 120)));
const pool = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

const seen = new Set<string>();
const items: Item[] = [];
for (const raw of pool) {
  if (!raw.title || !raw.url) continue;
  const id = createHash("sha1").update(raw.url).digest("hex").slice(0, 10);
  if (seen.has(id)) continue;
  seen.add(id);
  const text = `${raw.title} ${raw.description ?? ""}`;
  const hangul = (text.match(/[가-힣]/g) ?? []).length / Math.max(1, text.replace(/\s/g, "").length);
  items.push({
    ...raw,
    id,
    lang: hangul >= 0.15 ? "ko" : "en",
    site: new URL(raw.url).hostname.replace(/^www\./, ""),
    descFrom: raw.description ? "feed" : undefined,
    keywordHit: keywordHit(profile, text),
  });
}

const SEED = 20260923;
const picked: Item[] = [];
for (const [source, quota] of Object.entries(QUOTA)) {
  const all = shuffle(items.filter((i) => i.source === source), SEED);
  const hits = all.filter((i) => i.keywordHit);
  const misses = all.filter((i) => !i.keywordHit);
  const nHits = Math.min(hits.length, Math.ceil(quota / 2));
  const take = [...hits.slice(0, nHits), ...misses.slice(0, quota - nHits)];
  if (take.length < quota) take.push(...hits.slice(nHits, nHits + quota - take.length));
  if (take.length < quota) console.warn(`${source}: only ${take.length}/${quota} available`);
  picked.push(...take);
}

// Most HN links carry no feed description; fetch the page's own summary for those.
await Promise.all(
  picked
    .filter((i) => !i.description && !i.url.includes("news.ycombinator.com"))
    .map(async (i) => {
      const og = await ogDescription(i.url);
      if (og) Object.assign(i, { description: og, descFrom: "og" as const });
    }),
);

writeFileSync(OUT, JSON.stringify({ createdAt: new Date().toISOString(), seed: SEED, quota: QUOTA, items: shuffle(picked, SEED + 1) }, null, 1));
const by = (k: (i: Item) => string) => Object.entries(Object.groupBy(picked, k)).map(([g, v]) => `${g}=${v!.length}`).join(" ");
console.log(`pool ${items.length} → picked ${picked.length}`);
console.log("by lang:", by((i) => i.lang), "| keyword hits:", by((i) => `${i.lang}:${i.keywordHit ? "hit" : "miss"}`));
console.log("descriptions:", by((i) => `${i.lang}:${i.descFrom ?? "none"}`));

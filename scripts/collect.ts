// Hourly collector: sources → canonical items → dedupe → interest filter → data/items/YYYY-MM.jsonl.
// Summaries are a later step; this run decides which items are worth summarizing.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { profile, sources } from "../readery.config.ts";
import { canonical, itemId } from "./lib/canonical.ts";
import { JUNK, itemState, keywordHit, relevanceScore, route, type Route } from "./lib/llm/judgments.ts";
import { judge } from "./lib/llm/typesafe.ts";
import { fetchSource, geekNewsTarget } from "./lib/sources.ts";

export type Item = {
  id: string;
  url: string;
  title: string;
  description?: string;
  site: string;
  lang: "ko" | "en";
  via: Record<string, string>; // source id → where it was seen; two or more keys = "N곳에서 화제"
  publishedAt?: string;
  collectedAt: string;
  judgment: { by: "jev" | "keyword"; route: Route; model?: string; relevance?: Record<string, number>; junk?: number };
};

const DIR = "data/items";
const WINDOW = 7 * 86_400_000; // an older post seen for the first time is history, not news
const monthOf = (it: Item) => it.collectedAt.slice(0, 7);
const hangul = (s: string) => (s.match(/[가-힣]/g)?.length ?? 0) / Math.max(1, s.replace(/\s/g, "").length);

async function pool<T>(xs: T[], n: number, fn: (x: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < xs.length) await fn(xs[next++]); }));
}

// ---------- what we already have ----------
mkdirSync(DIR, { recursive: true });
const months = new Map<string, Item[]>();
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".jsonl")))
  months.set(f.slice(0, -".jsonl".length), readFileSync(`${DIR}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
const known = new Map<string, Item>();
for (const items of months.values()) for (const it of items) known.set(it.id, it);
const seenVia = new Set([...known.values()].flatMap((it) => Object.values(it.via)));

// ---------- fetch ----------
const results = await Promise.allSettled(sources.map(fetchSource));
const failed = sources.flatMap((s, i) => (results[i].status === "rejected" ? [`${s.id} (${String((results[i] as PromiseRejectedResult).reason).slice(0, 80)})`] : []));
const raws = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

// GeekNews topics point at the article they discuss, so an HN and a GeekNews copy merge into one item.
for (const r of raws) if (r.source === "geeknews" && r.via && !seenVia.has(r.via)) r.url = await geekNewsTarget(r.via).catch(() => r.url);

// ---------- dedupe ----------
const now = new Date();
const fresh: Item[] = [];
const dirty = new Set<string>();
let merged = 0;
for (const r of raws) {
  let url: string;
  try { url = canonical(r.url); } catch { continue; }
  const id = itemId(url);
  const old = known.get(id);
  if (old) {
    if (!old.via[r.source]) {
      old.via[r.source] = r.via ?? r.url;
      merged++;
      if (!fresh.includes(old)) dirty.add(monthOf(old));
    }
    continue;
  }
  const published = r.publishedAt ? new Date(r.publishedAt) : undefined;
  const validDate = published && !Number.isNaN(+published);
  if (validDate && now.getTime() - published.getTime() > WINDOW) continue;
  const item: Item = {
    id,
    url,
    title: r.title,
    description: r.description,
    site: new URL(url).hostname.replace(/^www\./, ""),
    lang: hangul(`${r.title} ${r.description ?? ""}`) >= 0.15 ? "ko" : "en",
    via: { [r.source]: r.via ?? r.url },
    publishedAt: validDate ? published.toISOString() : undefined,
    collectedAt: now.toISOString(),
    judgment: { by: "keyword", route: "maybe" },
  };
  known.set(id, item);
  fresh.push(item);
}

// ---------- interest filter ----------
// Jev judges each new item once (design S from the pilot: one relevance Score + junk Noul).
// After 3 failures in a row, or past a 60 s budget, the rest fall back to keywords.
const questions = { junk: JUNK, relevance: relevanceScore(profile, "en") };
const nameOf = Object.fromEntries(sources.map((s) => [s.id, s.name]));
const deadline = Date.now() + 60_000;
let failures = 0;
await pool(fresh, 3, async (it) => {
  if (process.env.TYPESAFE_API_KEY && failures < 3 && Date.now() < deadline) {
    try {
      const state = itemState({ id: it.id, title: it.title, description: it.description, source: nameOf[Object.keys(it.via)[0]], site: it.site }, true);
      const r = await judge(state, questions);
      const relevance = r.answers.relevance.probabilities as Record<string, number>;
      const junk = r.answers.junk.noul as number;
      it.judgment = { by: "jev", model: r.model, relevance, junk, route: route(relevance["2"] ?? 0, junk) };
      failures = 0;
      return;
    } catch (e) {
      failures++;
      console.warn(`jev failed on ${it.id}: ${String(e).slice(0, 120)}`);
    }
  }
  // ponytail: keyword items stay keyword-judged; re-judge them with Jev on a later run if fallbacks become common.
  it.judgment = { by: "keyword", route: keywordHit(profile, `${it.title} ${it.description ?? ""}`) ? "pass" : "maybe" };
});

// ---------- write ----------
for (const it of fresh) {
  const m = monthOf(it);
  if (!months.has(m)) months.set(m, []);
  months.get(m)!.push(it);
  dirty.add(m);
}
for (const m of dirty) writeFileSync(`${DIR}/${m}.jsonl`, `${months.get(m)!.map((it) => JSON.stringify(it)).join("\n")}\n`);

const count = (k: Route) => fresh.filter((it) => it.judgment.route === k).length;
console.log(
  `sources ${sources.length - failed.length}/${sources.length} · raw ${raws.length} · new ${fresh.length} · merged ${merged}` +
    ` · jev ${fresh.filter((it) => it.judgment.by === "jev").length} · pass ${count("pass")} / maybe ${count("maybe")} / drop ${count("drop")}`,
);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);

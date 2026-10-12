// Hourly collector, shared by every reader: sources → canonical items → dedupe → data/items/YYYY-MM.jsonl.
// Whether an item is worth a reader's time is judge.ts's call, per reader.
import { sources } from "../readery.config.ts";
import { canonical, itemId } from "./lib/canonical.ts";
import { fetchSource, geekNewsTarget } from "./lib/sources.ts";
import { loadItems, monthOf, saveItems, type Item } from "./lib/store.ts";

const WINDOW = 7 * 86_400_000; // an older post seen for the first time is history, not news
const hangul = (s: string) => (s.match(/[가-힣]/g)?.length ?? 0) / Math.max(1, s.replace(/\s/g, "").length);

// ---------- what we already have ----------
const months = loadItems();
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
const libraryOf: Record<string, string | undefined> = Object.fromEntries(sources.map((s) => [s.id, s.library]));
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
      // First seen on HN, now in a tool's own feed: it is that tool's news.
      old.library ??= libraryOf[r.source];
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
    library: libraryOf[r.source],
    publishedAt: validDate ? published.toISOString() : undefined,
    collectedAt: now.toISOString(),
  };
  known.set(id, item);
  fresh.push(item);
}

// ---------- write ----------
for (const it of fresh) {
  const m = monthOf(it);
  if (!months.has(m)) months.set(m, []);
  months.get(m)!.push(it);
  dirty.add(m);
}
saveItems(months, dirty);

console.log(
  `sources ${sources.length - failed.length}/${sources.length} · raw ${raws.length} · new ${fresh.length} · merged ${merged}` +
    ` · library ${fresh.filter((it) => it.library).length}`,
);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);

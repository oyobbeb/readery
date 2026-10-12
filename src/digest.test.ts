import assert from "node:assert/strict";
import { test } from "node:test";
import type { Item, Judgment } from "../scripts/lib/store.ts";
import { digest, kstDate } from "./digest.ts";

const item = (id: string, collectedAt: string, via: Record<string, string>, extra: Partial<Item> = {}): Item =>
  ({ id, url: `https://example.com/${id}`, title: id, site: "example.com", lang: "en", via, collectedAt, ...extra });
const verdict = (id: string, route: Judgment["route"], p2 = 0.5): Judgment => ({ id, by: "jev", route, relevance: { "0": 0, "1": 1 - p2, "2": p2 } });

test("a KST day starts at 15:00 UTC", () => {
  assert.equal(kstDate("2026-10-11T14:59:00.000Z"), "2026-10-11");
  assert.equal(kstDate("2026-10-11T15:00:00.000Z"), "2026-10-12");
});

test("tool news leaves the day lists; days rank by places, then confidence; drop is only counted", () => {
  const items = [
    item("vite", "2026-10-12T01:00:00.000Z", { vite: "https://github.com/vitejs/vite/releases/tag/v8.3.0" }, { title: "Vite 8.3.0", library: "vite" }),
    item("deno", "2026-10-12T01:00:00.000Z", { "deno-blog": "https://deno.com/blog/cloudflare" }, { title: "Deno is joining Cloudflare", library: "deno" }),
    item("solo-sure", "2026-10-12T02:00:00.000Z", { hn: "https://news.ycombinator.com/item?id=1" }),
    item("solo-unsure", "2026-10-12T02:00:00.000Z", { lobsters: "https://lobste.rs/s/x" }),
    item("twice", "2026-10-12T03:00:00.000Z", { hn: "https://news.ycombinator.com/item?id=2", geeknews: "https://news.hada.io/topic?id=3" }),
    item("maybe", "2026-10-12T04:00:00.000Z", { hn: "https://news.ycombinator.com/item?id=4" }),
    item("dropped", "2026-10-12T05:00:00.000Z", { hn: "https://news.ycombinator.com/item?id=5" }),
    item("unjudged", "2026-10-12T06:00:00.000Z", { hn: "https://news.ycombinator.com/item?id=6" }),
  ];
  const judgments = new Map<string, Judgment>([
    ["vite", { id: "vite", by: "subscribed", route: "pass" }],
    ["deno", { id: "deno", by: "subscribed", route: "pass" }],
    ["solo-sure", verdict("solo-sure", "pass", 0.9)],
    ["solo-unsure", verdict("solo-unsure", "pass", 0.7)],
    ["twice", verdict("twice", "pass", 0.66)],
    ["maybe", verdict("maybe", "maybe")],
    ["dropped", verdict("dropped", "drop", 0.1)],
  ]);
  const d = digest(items, judgments);
  assert.deepEqual(d.tools.top.map((t) => [t.tool, t.kind, t.text]), [["Vite", "release", "8.3.0"], ["Deno", "post", "is joining Cloudflare"]]);
  assert.deepEqual(d.days.map((day) => day.date), ["2026-10-12"]);
  assert.deepEqual(d.days[0].pass.map((e) => e.id), ["twice", "solo-sure", "solo-unsure"]);
  assert.deepEqual(d.days[0].maybe.map((e) => e.id), ["maybe"]);
  assert.equal(d.dropped, 1);
  assert.deepEqual(d.days[0].pass[0].mentions.map((m) => m.name), ["Hacker News", "GeekNews"]);
  assert.equal(d.updatedAt, "2026-10-12T06:00:00.000Z");
});

test("the tool band keeps each tool's newest item, four tools at most; the rest go to the fold", () => {
  const rel = (id: string, source: string, title: string, day: number) =>
    item(id, "2026-10-12T09:00:00.000Z", { [source]: `https://github.com/x/${id}` }, { title, library: source, publishedAt: `2026-10-${String(day).padStart(2, "0")}T00:00:00.000Z` });
  const items = [rel("v1", "vite", "Vite 8.3.0", 12), rel("n1", "node", "Node.js 26.11.0", 11), rel("v0", "vite", "Vite 8.2.0", 10), rel("b1", "bun", "Bun 1.4.0", 9), rel("z1", "zod", "Zod 4.6.0", 8), rel("h1", "hono", "Hono 4.9.0", 7)];
  const judgments = new Map(items.map((it) => [it.id, { id: it.id, by: "subscribed", route: "pass" } as Judgment]));
  const { tools } = digest(items, judgments);
  assert.deepEqual(tools.top.map((t) => t.id), ["v1", "n1", "b1", "z1"]);
  assert.deepEqual(tools.more.map((t) => t.id), ["v0", "h1"]);
});

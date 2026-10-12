// What the home page shows one reader: tool news on top, then the latest days of items the filter kept.
import { sources } from "../readery.config.ts";
import { loadItems, loadJudgments, loadUsers, type Item, type Judgment } from "../scripts/lib/store.ts";

export type Mention = { name: string; url?: string }; // url only where it leads somewhere new: a discussion thread
export type Entry = { id: string; url: string; title: string; site: string; places: number; mentions: Mention[] };
export type ToolNews = { id: string; url: string; tool: string; kind: "release" | "api" | "post"; text: string; date: string };
export type Day = { date: string; pass: Entry[]; maybe: Entry[] };
export type Digest = { updatedAt?: string; tools: { top: ToolNews[]; more: ToolNews[] }; days: Day[]; dropped: number };

const DAYS = 7;
const TOOL_ROWS = 4;
const TOOL_WINDOW = 14 * 86_400_000;
const byId = new Map(sources.map((s) => [s.id, s]));

// Korea has no daylight saving time, so KST is always UTC+9.
export const kstDate = (iso: string) => new Date(Date.parse(iso) + 9 * 3_600_000).toISOString().slice(0, 10);

function entry(it: Item): Entry {
  const mentions = Object.entries(it.via).map(([id, url]) => ({ name: byId.get(id)?.name ?? id, url: url === it.url ? undefined : url }));
  return { id: it.id, url: it.url, title: it.title, site: it.site, places: mentions.length, mentions };
}

function toolNews(it: Item): ToolNews {
  const source = byId.get(Object.keys(it.via).find((id) => byId.get(id)?.library) ?? "");
  const tool = source?.name ?? it.library!;
  const date = kstDate(it.publishedAt ?? it.collectedAt);
  if (source?.kind === "release") return { id: it.id, url: it.url, tool, kind: "release", text: it.title.slice(tool.length).trim(), date };
  if (source?.kind === "docs") return { id: it.id, url: it.url, tool, kind: "api", text: it.title.replace(/^.*new page /, ""), date };
  // "Deno is joining Cloudflare" reads as tool + rest; the page sets the tool name in bold.
  const text = it.title.toLowerCase().startsWith(`${tool.toLowerCase()} `) ? it.title.slice(tool.length + 1) : it.title;
  return { id: it.id, url: it.url, tool, kind: "post", text, date };
}

// Within a day: seen in more places first, then the more confident verdict, then the newer post.
const rank = (judgments: Map<string, Judgment>) => (a: Item, b: Item) =>
  Object.keys(b.via).length - Object.keys(a.via).length ||
  (judgments.get(b.id)?.relevance?.["2"] ?? 0) - (judgments.get(a.id)?.relevance?.["2"] ?? 0) ||
  (b.publishedAt ?? b.collectedAt).localeCompare(a.publishedAt ?? a.collectedAt);

export function digest(items: Item[], judgments: Map<string, Judgment>): Digest {
  const judged = items.filter((it) => judgments.has(it.id));
  const updatedAt = items.map((it) => it.collectedAt).sort().at(-1);
  const newest = updatedAt ? Date.parse(updatedAt) : 0;

  const news = judged
    .filter((it) => judgments.get(it.id)!.by === "subscribed" && newest - Date.parse(it.publishedAt ?? it.collectedAt) <= TOOL_WINDOW)
    .map(toolNews)
    .sort((a, b) => b.date.localeCompare(a.date));
  // The band shows each tool's newest item, four tools at most; the rest wait in a fold.
  const top: ToolNews[] = [];
  for (const t of news) if (top.length < TOOL_ROWS && !top.some((x) => x.tool === t.tool)) top.push(t);
  const tools = { top, more: news.filter((t) => !top.includes(t)) };

  const rest = judged.filter((it) => judgments.get(it.id)!.by !== "subscribed");
  const dates = [...new Set(rest.map((it) => kstDate(it.collectedAt)))].sort().reverse().slice(0, DAYS);
  const days = dates.map((date) => {
    const ofDay = rest.filter((it) => kstDate(it.collectedAt) === date).sort(rank(judgments));
    const of = (route: Judgment["route"]) => ofDay.filter((it) => judgments.get(it.id)!.route === route).map(entry);
    return { date, pass: of("pass"), maybe: of("maybe") };
  });
  const shown = new Set(dates);
  const dropped = rest.filter((it) => shown.has(kstDate(it.collectedAt)) && judgments.get(it.id)!.route === "drop").length;
  return { updatedAt, tools, days, dropped };
}

export function loadDigest(userId: string) {
  const user = loadUsers().find((u) => u.id === userId);
  if (!user) throw new Error(`no data/users/${userId}/profile.json`);
  return { ...digest([...loadItems().values()].flat(), loadJudgments(userId)), interests: user.profile.interests.map((t) => t.ko) };
}

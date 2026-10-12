// Every file Readery keeps, and the only module that reads or writes them.
//   data/items/YYYY-MM.jsonl                 shared: what was published, one row per article
//   data/users/<id>/profile.json             per reader: interests and the tools they follow
//   data/users/<id>/judgments/YYYY-MM.jsonl  per reader: the filter's verdict on each item, filed under the item's month
// ponytail: plain files in git while there is one reader; a database version replaces this module, not its callers.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Profile, Route } from "./llm/judgments.ts";

export type Item = {
  id: string;
  url: string;
  title: string;
  description?: string;
  site: string;
  lang: "ko" | "en";
  via: Record<string, string>; // source id → where it was seen; two or more keys = "N곳에서 화제"
  library?: string; // a release, blog post or new API page of this tool (Source.library)
  publishedAt?: string;
  collectedAt: string;
};

export type Judgment = { id: string; by: "jev" | "keyword" | "subscribed"; route: Route; model?: string; relevance?: Record<string, number>; junk?: number };

// `follows`: tools whose every item passes. `keywords`: the filter when Jev is unreachable.
export type User = { id: string; profile: Profile & { follows: string[] } };

type Months<T> = Map<string, T[]>;
export const monthOf = (it: Item) => it.collectedAt.slice(0, 7);

function readMonths<T>(dir: string): Months<T> {
  const months: Months<T> = new Map();
  if (!existsSync(dir)) return months;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".jsonl")))
    months.set(f.slice(0, -".jsonl".length), readFileSync(`${dir}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  return months;
}

function writeMonths<T>(dir: string, months: Months<T>, which: Iterable<string> = months.keys()) {
  mkdirSync(dir, { recursive: true });
  for (const m of which) writeFileSync(`${dir}/${m}.jsonl`, `${months.get(m)!.map((r) => JSON.stringify(r)).join("\n")}\n`);
}

export const loadItems = () => readMonths<Item>("data/items");
export const saveItems = (months: Months<Item>, which: Iterable<string>) => writeMonths("data/items", months, which);

export const loadUsers = (): User[] =>
  readdirSync("data/users", { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ id: d.name, profile: JSON.parse(readFileSync(`data/users/${d.name}/profile.json`, "utf8")) }));

export const loadJudgments = (user: string) =>
  new Map([...readMonths<Judgment>(`data/users/${user}/judgments`).values()].flat().map((j) => [j.id, j]));

// Rewrites every month: an old item can get a new verdict when it shows up in a followed tool's feed.
export function saveJudgments(user: string, judgments: Map<string, Judgment>, items: Iterable<Item>) {
  const months: Months<Judgment> = new Map();
  for (const it of items) {
    const j = judgments.get(it.id);
    if (!j) continue;
    if (!months.has(monthOf(it))) months.set(monthOf(it), []);
    months.get(monthOf(it))!.push(j);
  }
  writeMonths(`data/users/${user}/judgments`, months);
}

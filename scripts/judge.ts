// Per-reader interest filter, run after collect.ts: every item a reader has no verdict on yet → data/users/<id>/judgments.
// Items of a tool the reader follows pass without Jev, including old items that later showed up in that tool's own feed.
import { sources } from "../readery.config.ts";
import { JUNK, itemState, keywordHit, relevanceScore, route, type Route } from "./lib/llm/judgments.ts";
import { judge } from "./lib/llm/typesafe.ts";
import { loadItems, loadJudgments, loadUsers, saveJudgments, type Item, type Judgment } from "./lib/store.ts";

async function pool<T>(xs: T[], n: number, fn: (x: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < xs.length) await fn(xs[next++]); }));
}

const items = [...loadItems().values()].flat();
const nameOf = Object.fromEntries(sources.map((s) => [s.id, s.name]));

for (const user of loadUsers()) {
  const judgments = loadJudgments(user.id);
  const follows = new Set(user.profile.follows);
  const pending: Item[] = [];
  let subscribed = 0;
  for (const it of items) {
    if (it.library && follows.has(it.library)) {
      if (judgments.get(it.id)?.by !== "subscribed") {
        judgments.set(it.id, { id: it.id, by: "subscribed", route: "pass" });
        subscribed++;
      }
    } else if (!judgments.has(it.id)) pending.push(it);
  }

  // Jev judges each item once (design S from the pilot: one relevance Score + junk Noul).
  // After 3 failures in a row, or past a 60 s budget, the rest fall back to keywords.
  // ponytail: a new reader's first run sends the whole history here; cap it to recent months when a second reader joins.
  const questions = { junk: JUNK, relevance: relevanceScore(user.profile, "en") };
  const deadline = Date.now() + 60_000;
  let failures = 0;
  const fresh: Judgment[] = [];
  await pool(pending, 3, async (it) => {
    let j: Judgment | undefined;
    if (process.env.TYPESAFE_API_KEY && failures < 3 && Date.now() < deadline) {
      try {
        const state = itemState({ id: it.id, title: it.title, description: it.description, source: nameOf[Object.keys(it.via)[0]], site: it.site }, true);
        const r = await judge(state, questions);
        const relevance = r.answers.relevance.probabilities as Record<string, number>;
        const junk = r.answers.junk.noul as number;
        j = { id: it.id, by: "jev", model: r.model, relevance, junk, route: route(relevance["2"] ?? 0, junk) };
        failures = 0;
      } catch (e) {
        failures++;
        console.warn(`jev failed on ${it.id}: ${String(e).slice(0, 120)}`);
      }
    }
    // ponytail: keyword verdicts stay; re-judge them with Jev on a later run if fallbacks become common.
    j ??= { id: it.id, by: "keyword", route: keywordHit(user.profile, `${it.title} ${it.description ?? ""}`) ? "pass" : "maybe" };
    judgments.set(it.id, j);
    fresh.push(j);
  });

  saveJudgments(user.id, judgments, items);
  const count = (k: Route) => fresh.filter((j) => j.route === k).length;
  console.log(
    `${user.id}: judged ${fresh.length} · jev ${fresh.filter((j) => j.by === "jev").length} · subscribed ${subscribed}` +
      ` · pass ${count("pass")} / maybe ${count("maybe")} / drop ${count("drop")}`,
  );
}

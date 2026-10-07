// Runs the interest-filter questions over the pilot items and scores them against the user's labels.
// Before labels exist it reports only operational numbers: tokens, latency, route mix, stability.
// Raw probabilities are cached per variant, so re-routing or re-scoring never calls the API again.
// It also writes data/labels/pilot-preds.json, the per-item prediction the labeling page reveals after a label.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { judge, JEV_MODEL } from "./lib/llm/typesafe.ts";
import { filterQuestions, itemState, keywordHit, route, THRESHOLDS, type FeedItem, type Lang, type Profile, type Route } from "./lib/llm/judgments.ts";

const DIR = "data/labels";
// PILOT_TAG scores another Jev-compatible model (see typesafe.ts) into its own runs and report, leaving Jev's untouched.
const TAG = process.env.PILOT_TAG;
const RUNS = TAG ? `${DIR}/runs-${TAG}` : `${DIR}/runs`;
const OUT = TAG ? `${DIR}/pilot-report-${TAG}` : `${DIR}/pilot-report`;
type Item = FeedItem & { lang: Lang; keywordHit: boolean };
// `blind` is the first label, committed before the page revealed Jev's prediction; that is what we score.
type Label = { label: "yes" | "maybe" | "no" | null; blind?: "yes" | "maybe" | "no"; junk?: boolean };
const items: Item[] = JSON.parse(readFileSync(`${DIR}/pilot-items.json`, "utf8")).items;
const profile: Profile = JSON.parse(readFileSync(`${DIR}/profile.json`, "utf8"));
const rawLabels: Record<string, Label> | null = existsSync(`${DIR}/pilot-labels.json`) ? JSON.parse(readFileSync(`${DIR}/pilot-labels.json`, "utf8")) : null;
const truthOf = (l: Label | undefined) => l?.blind ?? l?.label ?? null;
const labels = rawLabels && Object.fromEntries(Object.entries(rawLabels).filter(([, l]) => truthOf(l)).map(([id, l]) => [id, { label: truthOf(l)!, junk: !!l.junk }]));

type Variant = { id: string; lang: Lang; description: boolean; repeats: number };
const VARIANTS: Variant[] = [
  { id: "en-full", lang: "en", description: true, repeats: 3 }, // English profile, with descriptions (the production shape)
  { id: "ko-full", lang: "ko", description: true, repeats: 1 }, // Korean profile text
  { id: "en-title", lang: "en", description: false, repeats: 1 }, // titles only: is fetching descriptions worth it?
];

// Raw answers only; everything else is derived, so thresholds and designs can change offline.
type Answer = { probs: Record<string, number>; nouls: Record<string, number>; tokens: number; ms: number };
type Result = Answer | { error: string };
type Run = { hash: string; model: string; results: Record<string, Result> };
const CACHE_FORMAT = 2;

async function pool<T, R>(xs: T[], n: number, fn: (x: T) => Promise<R>) {
  const out: R[] = new Array(xs.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < xs.length) { const k = next++; out[k] = await fn(xs[k]); } }));
  return out;
}

async function runVariant(v: Variant, repeat: number): Promise<Run> {
  const questions = filterQuestions(profile, v.lang);
  const hash = createHash("sha1").update(JSON.stringify({ CACHE_FORMAT, questions, model: JEV_MODEL, description: v.description })).digest("hex").slice(0, 10);
  const file = `${RUNS}/${v.id}-r${repeat}.json`;
  const cached: Run | null = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (cached?.hash === hash && items.every((i) => i.id in cached.results && !("error" in cached.results[i.id]))) return cached;

  let model = JEV_MODEL;
  const results = Object.fromEntries(
    await pool(items, 3, async (item): Promise<[string, Result]> => {
      const prior = cached?.hash === hash ? cached.results[item.id] : undefined;
      if (prior && !("error" in prior)) return [item.id, prior];
      try {
        const r = await judge(itemState(item, v.description), questions);
        model = r.model;
        const a = r.answers as Record<string, any>;
        const nouls = Object.fromEntries(Object.entries(a).filter(([, x]) => x.type === "noul").map(([k, x]) => [k, x.noul]));
        return [item.id, { probs: a.relevance.probabilities, nouls, tokens: r.usage.input_tokens, ms: r.ms }];
      } catch (e) {
        return [item.id, { error: String(e).slice(0, 200) }];
      }
    }),
  );
  const run = { hash, model, results };
  mkdirSync(RUNS, { recursive: true });
  writeFileSync(file, JSON.stringify(run, null, 1));
  return run;
}

// ---------- derived values ----------
type Design = "S" | "N";
const ok = (r: Result | undefined): r is Answer => !!r && !("error" in r);
const maxOf = (a: Answer, prefix: string) => {
  const hits = Object.entries(a.nouls).filter(([k]) => k.startsWith(prefix));
  return hits.length ? hits.reduce((best, cur) => (cur[1] > best[1] ? cur : best)) : ["", 0] as [string, number];
};
const relOf = (a: Answer, d: Design) => (d === "S" ? a.probs["2"] ?? 0 : maxOf(a, "topic_")[1]);
const routeOf = (a: Answer, d: Design): Route => route(relOf(a, d), a.nouls.junk, d === "N" ? maxOf(a, "avoid_")[1] : 0);

// ---------- metrics ----------
const pct = (x: number) => (Number.isNaN(x) ? "–" : `${Math.round(x * 100)}%`);
const f2 = (x: number) => (Number.isNaN(x) ? "–" : x.toFixed(2));
const quantile = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * xs.length))] ?? NaN;
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

function auc(pos: number[], neg: number[]) {
  if (!pos.length || !neg.length) return NaN;
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

function scoreDesign(run: Run, d: Design, lang: Lang) {
  const rows = items.filter((i) => i.lang === lang && labels?.[i.id] && ok(run.results[i.id]));
  const decided = rows.filter((i) => labels![i.id].label !== "maybe");
  const truth = (i: Item) => labels![i.id].label === "yes";
  const ans = (i: Item) => run.results[i.id] as Answer;
  const routed = decided.map((i) => ({ route: routeOf(ans(i), d), yes: truth(i) }));
  const sure = routed.filter((x) => x.route !== "maybe");
  const bins = [0, 0.2, 0.4, 0.6, 0.8].map((lo) => {
    const inBin = decided.filter((i) => relOf(ans(i), d) >= lo && relOf(ans(i), d) < (lo === 0.8 ? 1.0001 : lo + 0.2));
    return { lo, n: inBin.length, yes: inBin.filter(truth).length };
  });
  const filled = bins.filter((b) => b.n >= 4).map((b) => b.yes / b.n);
  const positives = routed.filter((x) => x.yes);
  const negatives = routed.filter((x) => !x.yes);
  return {
    n: rows.length,
    positives: positives.length,
    negatives: negatives.length,
    auc: auc(decided.filter(truth).map((i) => relOf(ans(i), d)), decided.filter((i) => !truth(i)).map((i) => relOf(ans(i), d))),
    decidedAccuracy: sure.length ? sure.filter((x) => (x.route === "pass") === x.yes).length / sure.length : NaN,
    maybeRate: routed.length ? routed.filter((x) => x.route === "maybe").length / routed.length : NaN,
    recall: positives.length ? positives.filter((x) => x.route === "pass").length / positives.length : NaN,
    falsePass: negatives.length ? negatives.filter((x) => x.route === "pass").length / negatives.length : NaN,
    reliability: bins,
    monotone: filled.every((v, k) => k === 0 || v >= filled[k - 1] - 0.05),
  };
}

function keywordBaseline(lang: Lang) {
  const decided = items.filter((i) => i.lang === lang && labels?.[i.id] && labels[i.id].label !== "maybe");
  const hit = (i: Item) => keywordHit(profile, `${i.title} ${i.description ?? ""}`);
  return decided.length ? decided.filter((i) => hit(i) === (labels![i.id].label === "yes")).length / decided.length : NaN;
}

// ---------- run ----------
const runs = new Map<string, Run[]>();
for (const v of VARIANTS) {
  const list: Run[] = [];
  for (let k = 0; k < v.repeats; k++) list.push(await runVariant(v, k));
  runs.set(v.id, list);
}

const report: Record<string, unknown> = { model: runs.get("en-full")![0].model, thresholds: THRESHOLDS, labeled: labels ? Object.keys(labels).length : 0 };
const lines: string[] = [`model ${report.model} · thresholds ${JSON.stringify(THRESHOLDS)} · labels ${report.labeled}`];

for (const v of VARIANTS) {
  const run = runs.get(v.id)![0];
  const errors = items.filter((i) => !ok(run.results[i.id])).length;
  lines.push(`\n## ${v.id}  (errors ${errors})`);
  for (const lang of ["ko", "en"] as const) {
    const langRs = items.filter((i) => i.lang === lang).map((i) => run.results[i.id]).filter(ok);
    const mix = (d: Design) => (["pass", "maybe", "drop"] as const).map((r) => `${r} ${langRs.filter((x) => routeOf(x, d) === r).length}`).join(" / ");
    lines.push(`  ${lang}: tokens mean ${Math.round(mean(langRs.map((r) => r.tokens)))} · latency p50 ${quantile(langRs.map((r) => r.ms), 0.5)}ms p95 ${quantile(langRs.map((r) => r.ms), 0.95)}ms`);
    lines.push(`      route S: ${mix("S")}   |   route N: ${mix("N")}`);
    if (labels) {
      for (const d of ["S", "N"] as const) {
        const s = scoreDesign(run, d, lang);
        report[`${v.id}.${lang}.${d}`] = s;
        lines.push(`      ${d}: AUC ${f2(s.auc)} · decided acc ${pct(s.decidedAccuracy)} · maybe ${pct(s.maybeRate)} · recall ${pct(s.recall)} · false pass ${pct(s.falsePass)} · monotone ${s.monotone} · (+${s.positives}/-${s.negatives})`);
      }
      if (v.id === "en-full") lines.push(`      keyword baseline acc ${pct(keywordBaseline(lang))}`);
    }
  }
}

// Stability: the same request three times. Jev has no seed; the question is how often a route flips.
const reps = runs.get("en-full")!;
if (reps.length > 1) {
  lines.push(`\n## stability (en-full × ${reps.length})`);
  for (const d of ["S", "N"] as const) {
    const spread = items.map((i) => reps.map((r) => r.results[i.id]).filter(ok).map((a) => relOf(a, d))).filter((xs) => xs.length === reps.length);
    const flips = items.filter((i) => new Set(reps.map((r) => r.results[i.id]).filter(ok).map((a) => routeOf(a, d))).size > 1).length;
    lines.push(`  ${d}: mean |max-min| ${f2(mean(spread.map((xs) => Math.max(...xs) - Math.min(...xs))))} · items whose route flipped ${flips}/${items.length}`);
  }
}

if (labels) {
  const first = runs.get("en-full")![0];
  const labeled = items.filter((i) => labels[i.id] && ok(first.results[i.id]));
  const flagged = labeled.filter((i) => (first.results[i.id] as Answer).nouls.junk >= THRESHOLDS.junk);
  lines.push(`\n## junk (en-full): flagged ${flagged.length} · labeled junk ${labeled.filter((i) => labels[i.id].junk).length} · both ${flagged.filter((i) => labels[i.id].junk).length}`);
}

// Per-item prediction for the labeling page (production shape: English profile, with descriptions).
const base = runs.get("en-full")![0];
const preds = Object.fromEntries(
  items.filter((i) => ok(base.results[i.id])).map((i) => {
    const a = base.results[i.id] as Answer;
    const [topKey, n] = maxOf(a, "topic_");
    const avoid = maxOf(a, "avoid_")[1];
    // Which rule of route() decided a drop, checked in route()'s order.
    const why = a.nouls.junk >= THRESHOLDS.junk ? "junk" : avoid >= THRESHOLDS.avoid && n < THRESHOLDS.pass ? "avoid" : "relevance";
    return [i.id, { n, s: relOf(a, "S"), route: routeOf(a, "N"), why, top: Number(topKey.split("_")[1]), junk: a.nouls.junk, avoid }];
  }),
);
if (!TAG) writeFileSync(`${DIR}/pilot-preds.json`, JSON.stringify(preds, null, 1));

const text = lines.join("\n");
console.log(text);
writeFileSync(`${OUT}.json`, JSON.stringify(report, null, 1));
writeFileSync(`${OUT}.txt`, `${text}\n`);

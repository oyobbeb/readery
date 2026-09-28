import { noul, score } from "@typesafe-ai/sdk";

// Interest filter questions. Two designs are under test in the pilot; the loser gets deleted.
//   S — one relevance Score over the whole profile
//   N — one Noul per interest (and per "not interested" topic); code takes the max
// Question text stays English (Jev's strongest language); only the profile text varies by language.

export type Lang = "en" | "ko";
export type Topic = { ko: string; en: string };
export type Profile = { interests: Topic[]; notInterested: Topic[]; keywords: string[] };
export type Route = "pass" | "maybe" | "drop";

export type FeedItem = {
  id: string;
  title: string;
  description?: string;
  source: string;
  site: string;
  tags?: string[];
};

// What Jev sees. Only fields the questions need: extra detail costs accuracy ("context rot").
export function itemState(item: FeedItem, withDescription: boolean) {
  return {
    item: {
      title: item.title,
      ...(withDescription && item.description ? { description: item.description } : {}),
      source: item.source,
      site: item.site,
      ...(item.tags?.length ? { tags: item.tags } : {}),
    },
  };
}

export const JUNK = noul(
  "Is `item` a job posting, an advertisement or sponsored post, an event or webinar sign-up page, or a page with no substance of its own?",
  {
    true: "A job posting, an advertisement or sponsored post, an event or webinar sign-up page, or a page with nothing of its own.",
    false:
      "It has substance of its own: news, analysis, a tutorial, a discussion, release notes, a project, or an opinion. A short or missing description does not make the page empty.",
  },
);

export function relevanceScore(p: Profile, lang: Lang) {
  return score(
    {
      interests: p.interests.map((t) => t[lang]),
      not_interested: p.notInterested.map((t) => t[lang]),
      question:
        "How does `item` relate to the reader's `interests`? Judge what the item is actually about, not whether it shares a word with them. The item may be written in Korean or English.",
    },
    [
      "The item is about a subject that none of `interests` covers, or about something in `not_interested`.",
      "The item is mainly about something else and touches one of `interests` only in passing, as a mention, an example, or a side detail.",
      "One of `interests` is a main subject of the item: a release, tutorial, analysis, incident, or story about it.",
    ],
  );
}

export function topicNoul(topic: string) {
  return noul(
    { topic, question: "Is `topic` a main subject of `item`?" },
    {
      true: "`item` is mainly about `topic` or a direct part of it, such as a release, tutorial, analysis, incident, or story about it.",
      false: "`item` is about something else; `topic` is absent or appears only in passing.",
    },
  );
}

// Every question for one item goes in one request: they share the state and run in parallel.
export function filterQuestions(p: Profile, lang: Lang) {
  return {
    junk: JUNK,
    relevance: relevanceScore(p, lang),
    ...Object.fromEntries(p.interests.map((t, i) => [`topic_${i}`, topicNoul(t[lang])])),
    ...Object.fromEntries(p.notInterested.map((t, i) => [`avoid_${i}`, topicNoul(t[lang])])),
  };
}

// Every number the routing reads lives here. Starting points only — the pilot's labels decide them.
export const THRESHOLDS = { junk: 0.7, avoid: 0.7, pass: 0.65, drop: 0.35 };

export function route(relevance: number, junk: number, avoid = 0, t = THRESHOLDS): Route {
  if (junk >= t.junk) return "drop";
  if (avoid >= t.avoid && relevance < t.pass) return "drop";
  if (relevance >= t.pass) return "pass";
  if (relevance <= t.drop) return "drop";
  return "maybe";
}

// The keyword filter this replaces; it stays as the fallback and as the pilot's baseline.
export function keywordHit(p: Profile, text: string) {
  const lower = text.toLowerCase();
  return p.keywords.some((k) =>
    /^[\x00-\x7f]+$/.test(k) ? new RegExp(`(^|[^a-z0-9])${k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(lower) : lower.includes(k),
  );
}

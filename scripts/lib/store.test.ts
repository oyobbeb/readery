import assert from "node:assert/strict";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadJudgments, saveJudgments, type Item, type Judgment } from "./store.ts";

test("judgments round-trip, each filed under its item's month", () => {
  process.chdir(mkdtempSync(join(tmpdir(), "readery-")));
  const items = [
    { id: "a", collectedAt: "2026-09-30T23:00:00.000Z" },
    { id: "b", collectedAt: "2026-10-01T01:00:00.000Z" },
  ] as Item[];
  const judgments = new Map<string, Judgment>([
    ["a", { id: "a", by: "jev", route: "maybe", relevance: { "0": 0.2, "1": 0.3, "2": 0.5 }, junk: 0.1 }],
    ["b", { id: "b", by: "subscribed", route: "pass" }],
  ]);
  saveJudgments("me", judgments, items);
  assert.deepEqual(loadJudgments("me"), judgments);
  assert.deepEqual(readdirSync("data/users/me/judgments").sort(), ["2026-09.jsonl", "2026-10.jsonl"]);
});

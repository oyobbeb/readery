import assert from "node:assert/strict";
import { test } from "node:test";
import { canonical, itemId } from "./canonical.ts";

test("the same article with different decorations gets one id", () => {
  assert.equal(canonical("http://www.example.com/post/?utm_source=hn&ref=feed#comments"), "https://example.com/post");
  assert.equal(itemId("http://www.example.com/post/?utm_source=hn"), itemId("https://example.com/post"));
});

test("Medium's rss tracking parameter is dropped", () => {
  assert.equal(canonical("https://medium.com/daangn/abc-123?source=rss----1"), "https://medium.com/daangn/abc-123");
});

test("meaningful query parameters survive", () => {
  assert.equal(canonical("https://news.ycombinator.com/item?id=1"), "https://news.ycombinator.com/item?id=1");
});

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static output) at the repo root: `src/` is the site, `scripts/` the collect → judge pipeline, `data/` the git-stored records. UI framework only where a part is interactive (React islands); none yet. Hosting: Cloudflare Workers static assets on an own domain (readery.dev planned, not bought yet).

## Users

One reader today: the owner, a Korean web developer (frontend, backend, system design, the web, open source; works with React, Next.js, Solid, Qwik, Astro, Vite, Node, Bun, Deno, Go, Rust). Checks the feed several times a day on a phone and on a laptop, to see what is new in their field and decide what is worth reading. Later: other readers, each with their own interests (data already split into shared items and per-user judgments).

## Product Purpose

Collect new tech writing from Hacker News, Lobsters, GeekNews, 37 Korean and foreign company engineering blogs, and the release/doc feeds of the reader's own tools; keep only what matches the reader's interests (TypeSafe Jev); later summarize each kept item in Korean with margin-note explanations of terms, and link reading to a personal wiki. Success: the reader stops visiting sites one by one and misses nothing that matters to them.

## Positioning

- Same article seen in several places merges into one item, shown as "N곳에서 화제".
- Korean-first: Korean company blogs and GeekNews sit next to English sources; summaries and term notes are Korean.
- Tool news (new releases, new API doc pages) of the reader's own stack always gets through, unfiltered.
- The record lives in the reader's own git repo, not a vendor's server.

## Operating Context

Hourly collection (GitHub Actions), then a static rebuild. The reader opens the site on a phone between tasks and on a laptop at a desk; links open the original article.

## Capabilities and Constraints

- Shipped: collection (65 sources), dedupe, Jev interest filter (pass / maybe / drop), tool-news tracking.
- Not yet: Korean summaries and `title_ko` (needs ANTHROPIC_API_KEY), term notes, read/favorite state, wiki, graph, YouTube.
- Main screen (confirmed 2026-10-12): pass items by day, maybe items folded per day, drop items hidden; tool news in its own block at the top.
- Store only title, link, short description and summary; never article bodies.
- Public repo: everything in `data/` is public.

## Brand Commitments

Name: Readery (read + -ery, "a place for reading"). Interface language: Korean. Prior design prototypes the owner approved: reading prototype (warm paper palette, IBM Plex Sans KR, Nanum Myeongjo titles, IBM Plex Mono metadata, source chips, "N곳에서 화제", margin notes for terms).

## Evidence on Hand

Real collected items in `data/items/*.jsonl` (~450) and the owner's judgments in `data/users/me/judgments/`. No summaries, testimonials or usage numbers exist; do not fabricate them.

## Product Principles

- Reading first: the page is for deciding what to read, fast; nothing competes with titles.
- Show why an item is here (source, N places, tool news), never invent what it says.
- One reader now, many later: shared facts and personal verdicts stay separate.
- Calm over busy: a daily check should feel finishable.

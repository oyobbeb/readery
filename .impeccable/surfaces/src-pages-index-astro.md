---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

Scope: the home page (`/`), the reader's daily digest. Mode: Operate (scan, decide what to read, open it).

Audience and job: the owner, several times a day on a phone and a laptop: what is new for me, is anything about my tools, what is worth opening.
Content: tool news (subscribed items, last 14 days; each tool's newest item, four tools at most, the rest folded); the newest 7 KST days of items the filter passed, ranked by places seen, then Jev confidence; maybe items folded per day; drop only counted. Titles link to originals; discussion threads are chips.
Constraints: static build from `data/`, no client JS; Korean UI; light and dark follow the system.
Unresolved: archive pages beyond 7 days; Korean summaries and title_ko (the later summary step, which is also where any text under a title belongs); read state synced across devices.

## Direction contract

THESIS: A reading desk, not a dashboard. Each item's reason for being here (seen in N places, tool news) lives in the margin; the column holds only the title and its sources. Refuses the feed-app default of cards, thumbnails, excerpts and engagement counters.

OWN-WORLD: The owner-approved reading-prototype world: warm paper ground #F5F3EF, ink #1A1916, rust #9A4A1F. Rust owns whole regions: the tool-news band on #F5E6DC and the margin numerals. Article titles and day headings in serif (Source Serif 4 for Latin, Nanum Myeongjo for Hangul); labels and tool-band rows (tool name + version, i.e. labels) in IBM Plex Sans KR; numbers (dates, counts) in IBM Plex Mono. Discussion threads as hairline-outlined chips as in the prototype. Hairlines only; no cards, no shadows.

STORY: Open the page, read the freshness stamp, check tool news for the stack, then today's kept items with the most-discussed first. Tap a title to read the original, or a source chip to read the thread. Opened titles fade. Maybe items wait folded under each day.

FIRST VIEWPORT (390×844): masthead row with the serif wordmark left and the mono freshness stamp right; a full-bleed rust-tinted tool band of at most four rows plus a "도구 소식 N개 더" fold; a sticky serif day heading "10월 12일 (월)" with its kept count; the first items with rust "2곳" numerals in a 48px left margin. The primary action is the title link.

FORM: Marginalia. Signature move: heat numerals in the margin, larger and heavier at three places or more. Signature interaction: :visited titles fade to ink-2, a per-device read state with no JS. Motion: folds open with a 200ms opacity fade and a chevron turn (height animation dropped after the detector's layout-transition finding). Seed: none. No concept roll was run. The world comes from the reading prototype the owner reviewed in an earlier session (PRODUCT.md, Brand Commitments). The structure comes from the owner's answers on 2026-10-12: "통과만, 보류는 접어서" and "맨 위 '도구 소식' 칸". The owner waived the roll on 2026-10-12 ("프로토타입 그대로 괜찮아"): the reviewed prototype stands in as the seed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

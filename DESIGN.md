---
name: Readery
description: A personal reading desk for the day's tech writing, filtered by the reader's own interests.
colors:
  ground: "#f5f3ef"
  band: "#f5e6dc"
  ink: "#1a1916"
  ink-2: "#5c594f"
  ink-3: "#726e65"
  line: "#e2ddd2"
  line-2: "#cfc8b8"
  accent: "#9a4a1f"
  ground-dark: "#14130f"
  band-dark: "#2a1f17"
  ink-dark: "#ede9e0"
  ink-2-dark: "#b4afa2"
  ink-3-dark: "#8a8578"
  line-dark: "#2c2a24"
  line-2-dark: "#403d34"
  accent-dark: "#e8996b"
typography:
  display:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.005em"
  title-compact:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.45
  numeral:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1
  numeral-hot:
    fontFamily: "Source Serif 4, Nanum Myeongjo, serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "IBM Plex Sans KR, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  row:
    fontFamily: "IBM Plex Sans KR, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Sans KR, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  meta:
    fontFamily: "IBM Plex Sans KR, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "IBM Plex Sans KR, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
  figure:
    fontFamily: "IBM Plex Mono, IBM Plex Sans KR, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  focus: "2px"
  chip: "4px"
spacing:
  hair: "0.375rem"
  tight: "0.625rem"
  row: "0.875rem"
  section: "1.25rem"
  day: "1.75rem"
  edge: "0.75rem"
  edge-wide: "2rem"
  margin: "3rem"
  margin-wide: "5rem"
  column: "46rem"
components:
  source-chip:
    textColor: "{colors.ink-2}"
    typography: "{typography.caption}"
    rounded: "{rounded.chip}"
    padding: "0 0.5rem"
    height: "1.5rem"
  source-chip-hover:
    textColor: "{colors.ink}"
  tool-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.ink-2}"
    typography: "{typography.row}"
    padding: "0.875rem 0 0.5rem"
  day-heading:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "0.625rem 0 0.625rem 3rem"
  entry-title:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
  entry-title-visited:
    textColor: "{colors.ink-2}"
  heat-numeral:
    textColor: "{colors.accent}"
    typography: "{typography.numeral}"
  heat-numeral-hot:
    textColor: "{colors.accent}"
    typography: "{typography.numeral-hot}"
  fold-summary:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    height: "2.75rem"
---

# Design System: Readery

## Overview

**Creative North Star: "The Reading Desk"**

Readery is a sheet of warm paper with a margin, not a dashboard. Each item sits in a single reading column holding only its title and its sources; the reason it earned a place (seen in N places, a tool release, a date) is written in a left margin, the way a reader annotates a page. The column stays quiet so that titles are the loudest thing on screen.

The world is flat and tonal. Depth comes from one rust-tinted band and from hairline rules, never from cards or shadows. Rust (the single accent) owns whole regions and the margin numerals instead of being sprinkled on controls. Three type voices divide the work: a serif for what you read, a Korean sans for labels and rows, a mono for figures only. Light and dark both follow the system, with a dark palette that keeps the same roles on a near-black warm ground.

Density is calm and finishable: generous row padding (0.875rem), small quiet metadata, and anything secondary (more tool news, maybe items) folded behind a disclosure rather than shown.

**Key Characteristics:**
- Warm paper ground with near-black warm ink, three ink steps, two hairline steps, one rust accent.
- A fixed left margin column (3rem, 5rem from 48rem) that holds reasons and figures; the column holds titles.
- Serif titles and headings (Source Serif 4 for Latin, Nanum Myeongjo for Hangul).
- Hairlines and a single tinted band for structure; no cards, no shadows.
- Read state shown by visited titles fading, with no script.

## Colors

A warm, low-chroma paper-and-ink palette with one burnt-rust accent; the dark scheme mirrors every role.

### Primary
- **Burnt Rust** (accent; dark: Apricot Ember, accent-dark): the heat numerals in the margin, the tool band's heading, link-hover underlines, the focus ring, and the hover border of source chips. It marks reasons and attention, never surfaces.

### Neutral
- **Warm Paper** (ground; dark: ground-dark): page background, and the backing of the sticky day heading so rows scroll under it cleanly. Also the browser theme color.
- **Rust Wash** (band; dark: band-dark): the full-bleed tool-news band and the text selection highlight. The only tinted region on the page.
- **Desk Ink** (ink; dark: ink-dark): titles, tool names, the wordmark and day headings.
- **Faded Ink** (ink-2; dark: ink-2-dark): visited titles, tool-row text, margin dates, chip labels, fold summaries, quiet notes, colophon links.
- **Pencil Grey** (ink-3; dark: ink-3-dark): the freshness stamp, day counts, entry metadata, colophon text. The quietest legible step (4.58:1 on Warm Paper).
- **Paper Rule** (line; dark: line-dark): hairlines between entries, under the day heading, above the maybe fold and the colophon.
- **Pencil Rule** (line-2; dark: line-2-dark): the chip outline and the colophon link underline; one step firmer than Paper Rule because it outlines something tappable.

### Named Rules
**The Rust Owns Regions Rule.** The accent appears as a whole region (the tool band in Rust Wash) or as the margin's reason marks (heat numerals, the band heading), plus interaction state (hover underline, focus ring, chip hover border). It is never a button fill, a badge, or a decorative stripe.

**The Paired Palette Rule.** Every color role has a dark twin and pages follow `prefers-color-scheme`; a new color is added as a pair or not at all.

## Typography

**Display Font:** Source Serif 4 (600-700; Hangul falls through to Nanum Myeongjo 700, then serif)
**Body Font:** IBM Plex Sans KR (400, 600; with sans-serif)
**Label/Mono Font:** IBM Plex Mono (400; figures only, Hangul beside it falls through to IBM Plex Sans KR)

**Character:** A bookish serif for everything the reader reads, set against a plain, legible Korean sans for the apparatus around it, with a mono that appears only where digits must align.

### Hierarchy
- **Display** (700, 1.625rem, 1): the Readery wordmark only.
- **Headline** (600, 1.25rem, 1.3): sticky day headings, with the day's count beside them in the figure style.
- **Title** (600, 1.0625rem, 1.45, `text-wrap: pretty`): entry titles, the primary action of the page. Compact variant (0.9375rem, Faded Ink) for maybe items inside a fold.
- **Numeral** (600, 1.375rem, 1; 700, 1.875rem when hot): the serif count in the margin's "N곳" heat mark, in Burnt Rust.
- **Body** (400, 1rem, 1.6): the base; colophon and notes step down from it.
- **Row** (400, 0.9375rem, 1.45): tool-band rows, tool name in 600 Desk Ink, the rest in Faded Ink.
- **Label** (600, 0.875rem): the tool band heading and fold summaries.
- **Meta** (400, 0.8125rem, 1.5): source site and chips line under a title; colophon.
- **Caption** (400, 0.75rem): chip labels and tool kind labels.
- **Figure** (IBM Plex Mono 400, 0.75rem, tabular numerals): dates, the freshness stamp, counts.

### Named Rules
**The Three Voices Rule.** Serif for what is read (wordmark, day headings, titles, heat numerals), sans for labels and rows, mono for digits only. Never set Hangul prose or labels in the mono.

**The Keep-All Rule.** Body text uses `word-break: keep-all` with `overflow-wrap: anywhere`, so Korean breaks between words and long URLs or names still wrap.

## Layout

A single centered column (max 46rem) with a left margin column inside it. Every row is a two- or three-track grid: margin (3rem, 5rem from 48rem), content (`minmax(0, 1fr)`), and, in the tool band, a trailing kind label. Headings, fold summaries, quiet notes and colophon lines indent by the same margin so all reading text shares one left edge; only margin marks sit left of it.

Page edge padding is 0.75rem on phones and 2rem from 48rem, extended by safe-area insets. The tool band and its tint run full-bleed while its rows stay on the column grid. The one breakpoint is 48rem.

Vertical rhythm: 0.375rem between small items (meta gaps, tool rows, band heading), 0.625rem for headings and compact rows, 0.875rem for entry rows, 1.25rem for masthead and colophon openings, 1.75rem before each day. Day headings are sticky at the top of the viewport.

### Named Rules
**The Margin Holds the Reason Rule.** Why an item is here (place count, date) goes in the margin column, right-aligned against the content edge; the content column holds only the title and its sources.

## Elevation & Depth

Flat. There are no shadows anywhere. Depth is conveyed by one tonal region (the Rust Wash tool band against Warm Paper) and by 1px hairlines in Paper Rule. The sticky day heading separates from scrolling rows with its opaque Warm Paper backing and its bottom hairline, not with a shadow.

### Named Rules
**The Hairline Rule.** Structure is drawn with 1px rules and tonal regions only. No cards, no boxed containers, no shadows.

## Shapes

Square by default: regions, rows and headings have no corners at all. The only rounding is small and functional: 4px on source chips and 2px on focus outlines. Entry dividers start at the content edge, not the page edge, so the margin column reads as open space; the day heading's rule spans the full column.

## Components

### Source Chips
Hairline-outlined labels for discussion threads, quiet until touched.
- **Style:** transparent fill, 1px Pencil Rule outline, 4px corners, Faded Ink text at 0.75rem, `0 0.5rem` padding, at least 1.5rem tall for touch.
- **State:** hover turns the outline Burnt Rust and the text Desk Ink, no underline. Focus uses the global focus ring.
- **Plain variant:** a feed's own name with no thread link is plain text, preceded by a middle-dot separator, never a chip.

### Entry Row (signature)
- **Structure:** margin mark, then title (Title style, Desk Ink) and a wrapping meta line (site name, then chips) 0.5rem below.
- **Dividers:** a Paper Rule hairline above every entry after the first, within the content column.
- **Visited:** titles fade to Faded Ink (Pencil Grey in the compact list), a per-device read state with no script.
- **Hover:** underline in Burnt Rust, 1px, offset 0.2em.

### Heat Numeral (signature)
The serif count in the margin, Burnt Rust, followed by "곳" in the sans at 600. Shown only when an item was seen in two or more places; at three or more it grows to 1.875rem and 700. A screen-reader suffix completes "N곳에서 화제".

### Tool Band
Full-bleed Rust Wash region at the top of the page. A Label-style heading in Burnt Rust, then rows of margin date (figure style), tool name plus text, and a trailing kind label at 0.75rem. Visited rows fade the tool name to Faded Ink.

### Day Heading
Sticky, Warm Paper backing, Headline style, Paper Rule bottom hairline, the day's count beside it in the figure style at 0.75rem Pencil Grey.

### Fold (disclosure)
- **Style:** a native disclosure whose summary is Label style in Faded Ink, at least 2.75rem tall, indented to the margin, led by a 0.75rem stroked chevron (1.6 stroke, round caps).
- **States:** hover raises the summary to Desk Ink; open turns the chevron 90 degrees and fades the content in, both 200ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`; reduced motion removes both transitions. Height is not animated.
- **Maybe variant:** a Paper Rule hairline above, compact entries inside.

### Focus
2px solid Burnt Rust outline, 3px offset, 2px corners, on links and disclosure summaries.

## Do's and Don'ts

### Do:
- **Do** put an item's reason (place count, date) in the left margin column and keep the content column to title plus sources.
- **Do** set titles, day headings and heat numerals in Source Serif 4 with Nanum Myeongjo carrying Hangul.
- **Do** use IBM Plex Mono with tabular numerals for dates and counts only.
- **Do** mark structure with 1px Paper Rule hairlines and the single Rust Wash band.
- **Do** give every color a dark twin and follow the system scheme.
- **Do** fold secondary lists behind a native disclosure with the 200ms opacity fade and chevron turn.
- **Do** keep tappable labels at least 1.5rem tall and disclosure summaries at least 2.75rem tall.

### Don't:
- **Don't** use cards, boxed containers or shadows for any surface.
- **Don't** use Burnt Rust as a fill for buttons, badges or decoration; it marks reasons and interaction state.
- **Don't** set Hangul labels or prose in IBM Plex Mono.
- **Don't** animate the height of folds; fade the content instead.
- **Don't** render a feed's own name as a chip; chips are for discussion threads that link somewhere.

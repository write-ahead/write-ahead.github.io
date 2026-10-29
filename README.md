# Write-Ahead

A hand-drawn blog about **database internals**, written as an ordered book of chapters —
pages, B-trees, write-ahead logs, locks — rebuilt from sketches and small animations.

Sibling site to [The Overfit](../the-overfit.github.io) (ML explainers): same
philosophy (Astro + React islands + [rough.js](https://roughjs.com) hand-drawn diagrams,
"theme + custom components"), its own identity — cool engineering-pad palette, page-grid
background, indigo/teal accents, Shantell Sans + JetBrains Mono.

## Stack

- **Astro 5** — static, zero JS by default; React islands for the interactive diagrams.
- **rough.js** — the sketchy, hand-drawn diagrams.
- **react-rough-notation** — self-drawing inline annotations.
- Content lives in `src/content/chapters/*.mdx`, ordered by the `order` frontmatter field
  and grouped into Parts via `part`.

## The reusable kit

- `src/styles/global.css` — all identity tokens (palette, fonts, grid). Change these and the
  whole site follows.
- `src/components/Logo.astro` + `public/favicon.svg` — the append-only "write-ahead log" mark.
- `src/components/SlottedPage.tsx` — signature island: insert rows into a slotted page.
- `src/components/BTreePath.tsx` — signature island: a B+tree key lookup, animated.
- `src/components/Annotate.tsx` — self-drawing inline marks (`<Annotate type="circle">`).
- `src/components/Figure.astro`, `MarginNote.astro` — sketch-bordered figure / aside.
  (Borders are drawn client-side by the `[data-sketch-frame]` script in `BaseLayout.astro`.)

## Writing a chapter

Add `src/content/chapters/<slug>.mdx` with frontmatter: `title`, `description`, `pubDate`,
`order` (position in the book), `part`, `tags`, optional `draft: true` (shows as "coming
soon" on the home page, no published page). Import any component and drop it in.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run build    # static build → dist/
npm run preview  # preview the build
```

Requires Node 18+ (developed on Node 26).

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** position in the book — lower comes first */
    order: z.number(),
    /** the Part this chapter belongs to, e.g. "Storage". Also scopes a series:
     *  prev/next navigation and chapter numbering stay within the same Part. */
    part: z.string().default('Internals'),
    /** optional URL path override, e.g. "victorialogs/internals/storage-engine/data-model".
     *  When set, the chapter is served at /<path> instead of /<id>. */
    path: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** publication state:
     *  - 'posted'  → live: built as a page and listed normally
     *  - 'soon'    → shown in listings as "coming soon", but no page is built
     *  - 'draft'   → never shown to readers; kept in the repo only */
    status: z.enum(['posted', 'soon', 'draft']).default('posted'),
    /** social-share image: a path like /og/the-wal.png (in public/) or a full
     *  URL. Omit to fall back to the site-wide /og-default.png card.
     *  For best results make it 1200×630. */
    ogImage: z.string().optional(),
  }),
});

export const collections = { chapters };

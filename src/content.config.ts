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
    /** the Part this chapter belongs to, e.g. "Storage" */
    part: z.string().default('Internals'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** social-share image: a path like /og/the-wal.png (in public/) or a full
     *  URL. Omit to fall back to the site-wide /og-default.png card.
     *  For best results make it 1200×630. */
    ogImage: z.string().optional(),
  }),
});

export const collections = { chapters };

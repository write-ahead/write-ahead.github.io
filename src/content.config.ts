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
  }),
});

export const collections = { chapters };

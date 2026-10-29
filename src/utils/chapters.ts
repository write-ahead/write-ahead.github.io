import { getCollection, type CollectionEntry } from 'astro:content';

export type Chapter = CollectionEntry<'chapters'>;

export interface TagGroup {
  /** original label as written in frontmatter, e.g. "storage" */
  label: string;
  /** url-safe slug */
  slug: string;
  /** chapters carrying this tag, in reading order */
  chapters: Chapter[];
}

export interface PartGroup {
  /** the Part name, e.g. "Storage" */
  name: string;
  /** its chapters, in reading order */
  chapters: Chapter[];
}

/** Turn a free-form tag into a url-safe slug. */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** All non-draft chapters, in reading order (by `order`). */
export async function getPublishedChapters(): Promise<Chapter[]> {
  const chapters = await getCollection('chapters', ({ data }) => !data.draft);
  return chapters.sort((a, b) => a.data.order - b.data.order);
}

/** Every chapter including drafts, in reading order — used for the book's ToC. */
export async function getAllChapters(): Promise<Chapter[]> {
  const chapters = await getCollection('chapters');
  return chapters.sort((a, b) => a.data.order - b.data.order);
}

/** Chapters grouped into Parts, each in reading order; Parts ordered by first chapter. */
export async function getParts(includeDrafts = true): Promise<PartGroup[]> {
  const chapters = includeDrafts ? await getAllChapters() : await getPublishedChapters();
  const map = new Map<string, PartGroup>();
  for (const ch of chapters) {
    const name = ch.data.part;
    if (!map.has(name)) map.set(name, { name, chapters: [] });
    map.get(name)!.chapters.push(ch);
  }
  return [...map.values()];
}

/** The chapter before and after a given one in reading order (published only). */
export async function getNeighbors(
  id: string
): Promise<{ prev: Chapter | null; next: Chapter | null }> {
  const chapters = await getPublishedChapters();
  const i = chapters.findIndex((c) => c.id === id);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i < chapters.length - 1 ? chapters[i + 1] : null,
  };
}

/** Reading-order index (1-based) of a chapter among published chapters. */
export async function getChapterNumber(id: string): Promise<number> {
  const chapters = await getPublishedChapters();
  const i = chapters.findIndex((c) => c.id === id);
  return i === -1 ? 0 : i + 1;
}

/** Every tag, each with its chapters, sorted by popularity then name. */
export async function getAllTags(): Promise<TagGroup[]> {
  const chapters = await getPublishedChapters();
  const map = new Map<string, TagGroup>();
  for (const ch of chapters) {
    for (const raw of ch.data.tags) {
      const slug = slugifyTag(raw);
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, { label: raw, slug, chapters: [] });
      map.get(slug)!.chapters.push(ch);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.chapters.length - a.chapters.length || a.label.localeCompare(b.label)
  );
}

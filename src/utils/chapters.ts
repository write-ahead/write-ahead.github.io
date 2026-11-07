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

/** Live posts only (status 'posted'), in reading order (by `order`).
 *  These are the ones that get a page, tags, prev/next and numbering. */
export async function getPublishedChapters(): Promise<Chapter[]> {
  const chapters = await getCollection('chapters', ({ data }) => data.status === 'posted');
  return chapters.sort((a, b) => a.data.order - b.data.order);
}

/** Posts readers may see in listings: 'posted' + 'soon' (drafts excluded). */
export async function getListedChapters(): Promise<Chapter[]> {
  const chapters = await getCollection('chapters', ({ data }) => data.status !== 'draft');
  return chapters.sort((a, b) => a.data.order - b.data.order);
}

/** Chapters grouped into Parts, each in reading order; Parts ordered by first chapter.
 *  By default includes "coming soon" posts; set false for live posts only. */
export async function getParts(includeComingSoon = true): Promise<PartGroup[]> {
  const chapters = includeComingSoon ? await getListedChapters() : await getPublishedChapters();
  const map = new Map<string, PartGroup>();
  for (const ch of chapters) {
    const name = ch.data.part;
    if (!map.has(name)) map.set(name, { name, chapters: [] });
    map.get(name)!.chapters.push(ch);
  }
  return [...map.values()];
}

/** The public URL for a chapter: its `path` override, else its file id. */
export function chapterHref(ch: Chapter): string {
  return `/${ch.data.path ?? ch.id}`;
}

/** Published chapters sharing a Part, in reading order. A Part acts as a series:
 *  navigation and numbering never cross into other Parts (e.g. the dummy posts). */
async function getSeriesChapters(part: string): Promise<Chapter[]> {
  const chapters = await getPublishedChapters();
  return chapters.filter((c) => c.data.part === part);
}

/** The chapter before and after a given one, within its own Part/series. */
export async function getNeighbors(
  id: string
): Promise<{ prev: Chapter | null; next: Chapter | null }> {
  const all = await getPublishedChapters();
  const self = all.find((c) => c.id === id);
  if (!self) return { prev: null, next: null };
  const series = await getSeriesChapters(self.data.part);
  const i = series.findIndex((c) => c.id === id);
  return {
    prev: i > 0 ? series[i - 1] : null,
    next: i < series.length - 1 ? series[i + 1] : null,
  };
}

/** 1-based index of a chapter within its own Part/series. */
export async function getChapterNumber(id: string): Promise<number> {
  const all = await getPublishedChapters();
  const self = all.find((c) => c.id === id);
  if (!self) return 0;
  const series = await getSeriesChapters(self.data.part);
  return series.findIndex((c) => c.id === id) + 1;
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

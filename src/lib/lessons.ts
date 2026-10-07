/**
 * Chargement des leçons au moment du build.
 * Chaque fichier `src/lessons/*.csv` devient une leçon (parsing dans `csv.ts`).
 */
import { parseCsv, titleFromSlug, type Lesson } from './csv.ts';
export type { Lesson, Word } from './csv.ts';

// `import.meta.glob` avec `eager` + `?raw` : les CSV sont lus à la compilation, jamais au runtime.
const files = import.meta.glob('../lessons/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const lessons: Lesson[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.csv$/, '');
    return { slug, title: titleFromSlug(slug), words: parseCsv(raw) };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug, 'fr', { numeric: true }));

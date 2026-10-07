/**
 * Parsing des leçons CSV (séparateur `;`, en-tête `nl;fr`). Logique pure, sans Vite, testée dans `check.test.ts`.
 */
export interface Word {
  /** Variantes acceptées en néerlandais (la première est affichée). */
  nl: string[];
  /** Variantes acceptées en français (la première est affichée). */
  fr: string[];
}

export interface Lesson {
  /** Identifiant d'URL, dérivé du nom de fichier (ex. `h1-een-nieuwe-school`). */
  slug: string;
  /** Titre lisible (ex. « Een nieuwe school »). */
  title: string;
  words: Word[];
}

/** Découpe une cellule en variantes sur `|`, en nettoyant les espaces. */
const variants = (cell: string): string[] =>
  cell.split('|').map((v) => v.trim()).filter(Boolean);

/** Parse le contenu brut d'un CSV `nl;fr` en liste de mots. */
export function parseCsv(raw: string): Word[] {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  const words: Word[] = [];
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    // Ligne d'en-tête : ignorée.
    if (i === 0 && /^nl\s*;\s*fr$/i.test(line.trim())) continue;
    const [nl = '', fr = ''] = line.split(';');
    const w: Word = { nl: variants(nl), fr: variants(fr) };
    if (w.nl.length && w.fr.length) words.push(w);
  }
  return words;
}

/** `h1-een-nieuwe-school` → « Een nieuwe school » (on retire le préfixe type `h1-`, `01-`…). */
export function titleFromSlug(slug: string): string {
  const cleaned = slug.replace(/^[a-z]?\d+[-_]/i, '').replace(/[-_]+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}


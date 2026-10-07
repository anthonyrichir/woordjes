/**
 * Correction d'une réponse. Logique pure, sans DOM, testée dans `check.test.ts`.
 */
export type Direction = 'nl-fr' | 'fr-nl';
export type Verdict = 'exact' | 'accents' | 'wrong';

export interface CheckOptions {
  direction: Direction;
  /** Exiger les articles de/het pour les réponses en néerlandais (défaut : non). */
  requireArticles?: boolean;
}

/** Minuscules, espaces superflus retirés, apostrophes typographiques unifiées. */
const normalize = (s: string): string =>
  s.trim().toLowerCase().replace(/[’‘`]/g, "'").replace(/\s*'\s*/g, "'").replace(/\s+/g, ' ');

/** Retire les accents (é → e, ë → e, ç → c…). */
const stripAccents = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '');

/** Retire un article néerlandais en début de réponse (« de hond » → « hond »). */
const stripArticle = (s: string): string => s.replace(/^(de|het|een) /, '');

/**
 * Compare la réponse de l'enfant aux traductions acceptées.
 * - `exact`   : bonne réponse
 * - `accents` : bonne réponse à un accent près (acceptée, mais on le signale)
 * - `wrong`   : mauvaise réponse
 */
export function check(answer: string, accepted: string[], opts: CheckOptions): Verdict {
  // En FR→NL l'enfant répond en néerlandais : on peut ignorer l'article.
  const relax = opts.direction === 'fr-nl' && !opts.requireArticles ? stripArticle : (s: string) => s;
  const given = relax(normalize(answer));
  if (!given) return 'wrong';
  const candidates = accepted.map((a) => relax(normalize(a)));
  if (candidates.includes(given)) return 'exact';
  if (candidates.map(stripAccents).includes(stripAccents(given))) return 'accents';
  return 'wrong';
}

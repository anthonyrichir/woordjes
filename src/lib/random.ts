/** Tirages aléatoires (logique pure, testée dans `random.test.ts`). */

/** Mélange de Fisher-Yates (copie). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Échantillon aléatoire de `n` éléments au maximum, sans doublon (tout le tableau s'il est plus court). */
export const sample = <T>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, Math.max(0, n));

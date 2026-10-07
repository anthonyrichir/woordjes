// Génère les icônes PWA et le favicon à partir du hibou (src/assets/uiltje.svg).
// Lancer : npm run icons   (les PNG sont commités, pas besoin de relancer à chaque build)
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const svg = await readFile(new URL('../src/assets/uiltje.svg', import.meta.url));
await mkdir(new URL('../public/icons', import.meta.url), { recursive: true });

const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

/** Icône : fond crème arrondi + hibou. `pad` = marge (0.1 = 10 % de chaque côté). */
async function icon(size, pad, file, rounded) {
  const inner = Math.round(size * (1 - 2 * pad));
  const owl = await sharp(svg, { density: 300 }).resize(inner, inner).png().toBuffer();
  const r = rounded ? Math.round(size * 0.22) : 0;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#FFF1D6"/></svg>`,
  );
  await sharp(bg).composite([{ input: owl, gravity: 'centre' }]).png().toFile(out(file));
  console.log('✓', file);
}

await icon(192, 0.08, 'icons/icon-192.png', true);
await icon(512, 0.08, 'icons/icon-512.png', true);
// Maskable : zone sûre = cercle central de 80 %, donc marge plus large et pas d'arrondi.
await icon(512, 0.17, 'icons/icon-maskable-512.png', false);
await icon(180, 0.08, 'apple-touch-icon.png', false);
// Favicon SVG = le hibou tel quel.
await writeFile(out('uiltje.svg'), svg);
console.log('✓ uiltje.svg');

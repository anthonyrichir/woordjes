# Woordjes · Mot à Mot 🦉

Site statique d'entraînement au vocabulaire néerlandais pour des enfants de primaire (≈ 10 ans, Belgique francophone).
Hébergé sur GitHub Pages, installable comme application (PWA), 100 % hors ligne après la première visite.
Mascotte : **Uiltje**, un petit hibou qui réagit aux réponses.

- **Stack** : [Astro](https://astro.build) + TypeScript, aucun backend, aucune base de données.
- **Déploiement** : GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`).
- **URL** : `https://anthonyrichir.github.io/woordjes/`

## Ajouter une leçon

1. Crée un fichier CSV dans `src/lessons/`, par exemple `h2-mijn-familie.csv`.
2. Format : séparateur `;`, en-tête `nl;fr`, encodage UTF-8.

   ```csv
   nl;fr
   de hond;le chien
   lopen;marcher|courir
   de lijm|de plakstift;la colle|le bâton de colle
   ```

   - `|` sépare plusieurs traductions acceptées (dans les deux colonnes). La première est affichée, toutes sont acceptées.
   - Les articles `de`/`het` ne sont pas exigés par défaut (case à cocher dans l'appli).
3. Le **nom du fichier** devient le titre : `h2-mijn-familie.csv` → « Mijn familie » (le préfixe `h2-`, `01-`… est retiré, les tirets deviennent des espaces).
4. Commit + push sur `main` : le site se reconstruit et se déploie tout seul. Les CSV sont lus au build, jamais au runtime.

## Développer en local

```bash
npm install
npm run dev        # http://localhost:4321/woordjes/
npm test           # tests de la correction et du parsing CSV (node --test, sans dépendance)
npm run build      # génère dist/
npm run preview    # sert dist/ (pour tester le service worker)
npm run icons      # régénère les icônes PWA depuis src/assets/uiltje.svg
```

Node ≥ 22.12 requis.

## Déployer

1. Crée un dépôt GitHub nommé `woordjes` (ou adapte `site` et `base` dans `astro.config.mjs`).
2. Dans **Settings → Pages**, choisis **Source : GitHub Actions**.
3. Pousse sur `main`. Le workflow lance les tests, construit le site et le publie.

### Analytics Umami (optionnel)

[Umami](https://umami.is) est sans cookie, sans donnée personnelle, conforme RGPD par conception. Si les variables sont vides, aucun script n'est chargé.

| Variable                   | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `PUBLIC_UMAMI_SCRIPT_URL`  | URL du script, ex. `https://cloud.umami.is/script.js` ou ton instance |
| `PUBLIC_UMAMI_WEBSITE_ID`  | Identifiant du site dans Umami                                         |

- En local : copie `.env.example` vers `.env`.
- Sur GitHub : **Settings → Secrets and variables → Actions → Variables** (onglet *Variables*, pas *Secrets*), crée les deux variables.

Données collectées :

- Pages vues (accueil, chaque leçon).
- Événement `quiz_termine` à la fin d'une session, avec : `lecon`, `direction` (NL→FR / FR→NL), `nb_mots`, `score` (bons du premier coup), `rates_premier_essai`.

Aucun nom, aucun identifiant d'élève, aucun cookie. **Préviens les parents** que des statistiques d'usage anonymes sont collectées (c'est une bonne pratique même si aucune donnée personnelle n'est traitée).

## Installer l'appli sur un téléphone ou une tablette

- **iPhone / iPad (Safari)** : Safari ne propose pas d'installation automatique. Ouvre le site, appuie sur le bouton **Partager** (le carré avec une flèche), puis **« Sur l'écran d'accueil »**. L'icône du hibou apparaît avec le nom « Woordjes ».
- **Android (Chrome)** : une bannière « Installer » apparaît, ou menu ⋮ → **« Installer l'application »**.
- **Ordinateur (Chrome / Edge)** : icône d'installation dans la barre d'adresse.

Une fois visitée, l'appli fonctionne sans connexion (service worker Workbox, mise à jour automatique).

## Structure

```
src/
  lessons/            ← un CSV par leçon
  lib/csv.ts          ← parsing CSV + titre depuis le nom de fichier (pur, testé)
  lib/check.ts        ← correction des réponses (casse, espaces, accents, articles, variantes)
  lib/lessons.ts      ← chargement des CSV au build (import.meta.glob)
  scripts/quiz.ts     ← logique du quiz côté client
  components/Owl.astro← la mascotte (SVG inline, animée en CSS) ; nom dans MASCOT_NAME
  assets/uiltje.svg   ← dessin source du hibou (icônes + favicon via scripts/make-icons.mjs)
  layouts/Layout.astro← <head> PWA/iOS, polices, Umami, thème sombre
  pages/              ← accueil + lecon/[slug]
  styles/global.css   ← design mobile-first, animations, prefers-reduced-motion
```

## Fonctionnement du quiz

- Choix du sens (NL→FR ou FR→NL), case « je dois écrire de/het ».
- Mots dans un ordre aléatoire, correction immédiate, les mots ratés reviennent en fin de session jusqu'à réussite.
- Tolérance : casse, espaces, apostrophes ; accents acceptés mais signalés.
- **Entrée** pour valider, **Entrée** à nouveau pour passer au mot suivant.
- Bouton 🔊 : prononciation néerlandaise via l'API Web Speech (voix `nl-NL` du système ; en FR→NL le bouton n'apparaît qu'après la correction pour ne pas donner la réponse).
